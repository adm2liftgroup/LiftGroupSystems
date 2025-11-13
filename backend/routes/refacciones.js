const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require('multer');
const { uploadImageToS3, deleteFromS3 } = require('../aws-s3');

// Configurar multer para imágenes
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite para imágenes
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)'));
    }
  }
});

// BLOQUE 1: Obtener todas las observaciones/refacciones
router.get("/", async (req, res) => {
  try {
    const q = await pool.query(
      `SELECT 
        om.*,
        mp.tipo as mantenimiento_tipo,
        mp.fecha as mantenimiento_fecha,
        m.numero as montacargas_numero,
        m."Marca" as montacargas_marca,
        m."Modelo" as montacargas_modelo,
        m."Serie" as montacargas_serie,
        u1.nombre as tecnico_nombre,
        u2.nombre as resuelto_por_nombre
       FROM observaciones_mantenimiento om
       JOIN mantenimientos_programados mp ON om.mantenimiento_id = mp.id
       JOIN "Montacargas" m ON mp.montacargas_id = m.numero
       LEFT JOIN "Usuarios" u1 ON om.creado_por = u1.id
       LEFT JOIN "Usuarios" u2 ON om.resuelto_por = u2.id
       ORDER BY om.creado_en DESC`
    );

    res.json({
      success: true,
      refacciones: q.rows
    });
  } catch (err) {
    console.error("Error obteniendo refacciones:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al obtener refacciones" 
    });
  }
});

// BLOQUE 2: Obtener observaciones de un mantenimiento específico
router.get("/mantenimiento/:mantenimientoId", async (req, res) => {
  try {
    const { mantenimientoId } = req.params;

    const q = await pool.query(
      `SELECT 
        om.*,
        u1.nombre as tecnico_nombre,
        u2.nombre as resuelto_por_nombre
       FROM observaciones_mantenimiento om
       LEFT JOIN "Usuarios" u1 ON om.creado_por = u1.id
       LEFT JOIN "Usuarios" u2 ON om.resuelto_por = u2.id
       WHERE om.mantenimiento_id = $1
       ORDER BY om.creado_en DESC`,
      [mantenimientoId]
    );

    res.json({
      success: true,
      observaciones: q.rows
    });
  } catch (err) {
    console.error("Error obteniendo observaciones:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al obtener observaciones" 
    });
  }
});

// BLOQUE 3: Agregar nueva observación/refacción CON IMAGEN - CORREGIDO PARA AWS S3
router.post("/", upload.single('imagen'), async (req, res) => {
  try {
    console.log('📥 POST /api/refacciones recibido');
    console.log('📋 Body fields:', req.body);
    console.log('📁 File:', req.file ? `Sí - ${req.file.originalname}` : 'No');

    // Campos del body
    const { 
      mantenimiento_id, 
      descripcion,
      cargo_a = 'empresa',
      estado_resolucion = 'pendiente',
      es_evidencia = 'false'
    } = req.body;

    console.log('🔍 Campos recibidos:', {
      mantenimiento_id,
      descripcion,
      cargo_a,
      estado_resolucion,
      es_evidencia
    });

    // Validaciones
    if (!mantenimiento_id) {
      console.log('❌ mantenimiento_id faltante');
      return res.status(400).json({ 
        success: false,
        error: "mantenimiento_id es requerido" 
      });
    }

    if (!descripcion) {
      console.log('❌ descripcion faltante');
      return res.status(400).json({ 
        success: false,
        error: "descripcion es requerido" 
      });
    }

    // Verificar que el mantenimiento existe
    const mantenimientoCheck = await pool.query(
      `SELECT mp.*, m.numero as montacargas_numero 
       FROM mantenimientos_programados mp
       JOIN "Montacargas" m ON mp.montacargas_id = m.numero
       WHERE mp.id = $1`,
      [mantenimiento_id]
    );

    if (mantenimientoCheck.rows.length === 0) {
      console.log('❌ Mantenimiento no encontrado:', mantenimiento_id);
      return res.status(404).json({ 
        success: false,
        error: "Mantenimiento no encontrado" 
      });
    }

    let imagen_url = null;
    let imagen_nombre = null;

    // Subir imagen si se proporcionó - CORREGIDO PARA AWS S3
    if (req.file) {
      try {
        console.log('📤 Subiendo imagen a AWS S3...');
        imagen_url = await uploadImageToS3(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        imagen_nombre = req.file.originalname;
        console.log('✅ Imagen subida a S3:', imagen_url);
      } catch (imageError) {
        console.error('❌ Error subiendo imagen a S3:', imageError);
        // Continuar sin la imagen
      }
    }

    console.log('💾 Guardando en base de datos...');
    
    // Convertir es_evidencia a boolean
    const esEvidenciaBool = es_evidencia === 'true' || es_evidencia === true;
    
    const result = await pool.query(
      `INSERT INTO observaciones_mantenimiento 
       (mantenimiento_id, descripcion, cargo_a, estado_resolucion, creado_por, imagen_url, imagen_nombre, es_evidencia)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        mantenimiento_id, 
        descripcion.trim(), 
        cargo_a, 
        estado_resolucion,
        req.user?.id || null, 
        imagen_url, 
        imagen_nombre,
        esEvidenciaBool
      ]
    );

    console.log('✅ Observación guardada correctamente');
    res.json({
      success: true,
      refaccion: result.rows[0],
      message: "Observación/refacción agregada correctamente" + (imagen_url ? " con imagen" : "")
    });
  } catch (err) {
    console.error("❌ Error agregando refacción:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al agregar refacción" 
    });
  }
});

// BLOQUE 4: Actualizar observación/refacción CON IMAGEN - CORREGIDO PARA AWS S3
router.put("/:id", upload.single('imagen'), async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, cargo_a, estado_resolucion, es_evidencia } = req.body;

    console.log('📥 PUT /api/refacciones/' + id + ' recibido');
    console.log('📋 Body fields:', req.body);
    console.log('📁 File:', req.file ? `Sí - ${req.file.originalname}` : 'No');

    // Verificar que la observación existe
    const observacionCheck = await pool.query(
      'SELECT id, imagen_url, imagen_nombre FROM observaciones_mantenimiento WHERE id = $1',
      [id]
    );

    if (observacionCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Observación no encontrada" 
      });
    }

    let imagen_url = observacionCheck.rows[0].imagen_url;
    let imagen_nombre = observacionCheck.rows[0].imagen_nombre;

    // Si se sube una nueva imagen - CORREGIDO PARA AWS S3
    if (req.file) {
      try {
        // Eliminar imagen anterior si existe - CORREGIDO PARA AWS S3
        if (imagen_url && imagen_url.includes('amazonaws.com')) {
          await deleteFromS3(imagen_url);
          console.log('✅ Imagen anterior eliminada de S3');
        }

        // Subir nueva imagen - CORREGIDO PARA AWS S3
        console.log('📤 Subiendo nueva imagen a AWS S3...');
        imagen_url = await uploadImageToS3(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        imagen_nombre = req.file.originalname;
        console.log('✅ Nueva imagen subida a S3:', imagen_url);
      } catch (imageError) {
        console.error('❌ Error actualizando imagen en S3:', imageError);
        // Mantener la imagen anterior si hay error
      }
    }

    // Convertir es_evidencia a boolean
    const esEvidenciaBool = es_evidencia === 'true' || es_evidencia === true;

    let query = `UPDATE observaciones_mantenimiento 
                 SET descripcion = $1, cargo_a = $2, estado_resolucion = $3,
                     imagen_url = $4, imagen_nombre = $5, es_evidencia = $6`;
    let params = [descripcion, cargo_a, estado_resolucion, imagen_url, imagen_nombre, esEvidenciaBool];

    // Si se marca como resuelto, agregar fecha y usuario
    if (estado_resolucion === 'resuelto') {
      query += `, fecha_resolucion = NOW(), resuelto_por = $7`;
      params.push(req.user?.id || null);
    } else if (estado_resolucion === 'pendiente') {
      query += `, fecha_resolucion = NULL, resuelto_por = NULL`;
    }

    query += ` WHERE id = $${params.length + 1} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      refaccion: result.rows[0],
      message: "Observación/refacción actualizada correctamente"
    });
  } catch (err) {
    console.error("Error actualizando refacción:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al actualizar refacción" 
    });
  }
});

// BLOQUE 5: Eliminar observación/refacción - CORREGIDO PARA AWS S3
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Primero obtener la información para eliminar la imagen
    const observacion = await pool.query(
      'SELECT imagen_url FROM observaciones_mantenimiento WHERE id = $1',
      [id]
    );

    const result = await pool.query(
      'DELETE FROM observaciones_mantenimiento WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Observación no encontrada" 
      });
    }

    // Eliminar imagen de AWS S3 si existe - CORREGIDO PARA AWS S3
    if (observacion.rows.length > 0 && observacion.rows[0].imagen_url) {
      await deleteFromS3(observacion.rows[0].imagen_url);
      console.log('✅ Imagen eliminada de AWS S3');
    }

    res.json({
      success: true,
      message: "Observación/refacción eliminada correctamente"
    });
  } catch (err) {
    console.error("Error eliminando refacción:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al eliminar refacción" 
    });
  }
});

// BLOQUE 6: Eliminar solo la imagen de una observación - CORREGIDO PARA AWS S3
router.delete("/:id/imagen", async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener la observación
    const observacion = await pool.query(
      'SELECT imagen_url FROM observaciones_mantenimiento WHERE id = $1',
      [id]
    );

    if (observacion.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Observación no encontrada" 
      });
    }

    const imagen_url = observacion.rows[0].imagen_url;

    if (!imagen_url) {
      return res.status(400).json({ 
        success: false,
        error: "No hay imagen para eliminar" 
      });
    }

    // Eliminar imagen de AWS S3 - CORREGIDO PARA AWS S3
    await deleteFromS3(imagen_url);

    // Actualizar la observación para quitar la imagen
    const result = await pool.query(
      'UPDATE observaciones_mantenimiento SET imagen_url = NULL, imagen_nombre = NULL WHERE id = $1 RETURNING *',
      [id]
    );

    res.json({
      success: true,
      refaccion: result.rows[0],
      message: "Imagen eliminada correctamente"
    });
  } catch (err) {
    console.error("Error eliminando imagen:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al eliminar imagen" 
    });
  }
});

// BLOQUE 7: Resolver observación específica
router.put("/:id/resolver", async (req, res) => {
  try {
    const { id } = req.params;
    const resuelto_por = req.user?.id || null;

    const result = await pool.query(
      `UPDATE observaciones_mantenimiento 
       SET estado_resolucion = 'resuelto',
           fecha_resolucion = NOW(),
           resuelto_por = $1
       WHERE id = $2
       RETURNING *`,
      [resuelto_por, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Observación no encontrada" 
      });
    }

    // Obtener la observación actualizada con información completa
    const observacionActualizada = await pool.query(
      `SELECT om.*, 
              u1.nombre as tecnico_nombre,
              u2.nombre as resuelto_por_nombre
       FROM observaciones_mantenimiento om
       LEFT JOIN "Usuarios" u1 ON om.creado_por = u1.id
       LEFT JOIN "Usuarios" u2 ON om.resuelto_por = u2.id
       WHERE om.id = $1`,
      [id]
    );

    res.json({
      success: true,
      observacion: observacionActualizada.rows[0],
      message: "Observación marcada como resuelta"
    });

  } catch (err) {
    console.error("Error al resolver observación:", err);
    res.status(500).json({ 
      success: false,
      error: "Error interno del servidor" 
    });
  }
});

// BLOQUE 8: Obtener estadísticas de refacciones
router.get("/estadisticas", async (req, res) => {
  try {
    const estados = await pool.query(
      `SELECT estado_resolucion, COUNT(*) as total
       FROM observaciones_mantenimiento 
       GROUP BY estado_resolucion`
    );

    const cargos = await pool.query(
      `SELECT cargo_a, COUNT(*) as total
       FROM observaciones_mantenimiento 
       GROUP BY cargo_a`
    );

    const mensual = await pool.query(
      `SELECT 
         DATE_TRUNC('month', creado_en) as mes,
         COUNT(*) as total
       FROM observaciones_mantenimiento 
       GROUP BY DATE_TRUNC('month', creado_en)
       ORDER BY mes DESC
       LIMIT 12`
    );

    // Estadísticas por tipo (evidencia vs observación normal)
    const porTipo = await pool.query(
      `SELECT es_evidencia, COUNT(*) as total
       FROM observaciones_mantenimiento 
       GROUP BY es_evidencia`
    );

    res.json({
      success: true,
      estadisticas: {
        por_estado: estados.rows,
        por_cargo: cargos.rows,
        mensual: mensual.rows,
        por_tipo: porTipo.rows
      }
    });
  } catch (err) {
    console.error("Error obteniendo estadísticas:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al obtener estadísticas" 
    });
  }
});

module.exports = router;