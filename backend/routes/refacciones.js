const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require('multer');
const { uploadImageToS3, deleteFromS3 } = require('../aws-s3');

// Configurar multer para MÚLTIPLES imágenes
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

// BLOQUE 3: Agregar nueva observación con hasta 3 imágenes
router.post("/", upload.array('imagenes', 3), async (req, res) => {
  try {
    console.log('📥 POST /api/refacciones recibido');
    console.log('📋 Body fields:', req.body);
    console.log('📁 Files:', req.files ? `${req.files.length} archivos` : 'Ninguno');

    const { 
      mantenimiento_id, 
      descripcion,
      cargo_a = 'empresa',
      estado_resolucion = 'pendiente',
      es_evidencia = 'false'
    } = req.body;

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

    // Inicializar campos de imágenes
    let imagen_url_1 = null, imagen_nombre_1 = null;
    let imagen_url_2 = null, imagen_nombre_2 = null;
    let imagen_url_3 = null, imagen_nombre_3 = null;

    // Subir hasta 3 imágenes
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < Math.min(req.files.length, 3); i++) {
        const file = req.files[i];
        try {
          console.log(`📤 Subiendo imagen ${i+1}/${req.files.length} a AWS S3...`);
          const imagen_url = await uploadImageToS3(
            file.buffer,
            file.originalname,
            file.mimetype
          );

          // Asignar a los campos correspondientes
          if (i === 0) {
            imagen_url_1 = imagen_url;
            imagen_nombre_1 = file.originalname;
          } else if (i === 1) {
            imagen_url_2 = imagen_url;
            imagen_nombre_2 = file.originalname;
          } else if (i === 2) {
            imagen_url_3 = imagen_url;
            imagen_nombre_3 = file.originalname;
          }

          console.log('✅ Imagen subida a S3:', imagen_url);
        } catch (imageError) {
          console.error('❌ Error subiendo imagen a S3:', imageError);
        }
      }
    }

    console.log('💾 Guardando en base de datos...');
    
    // Convertir es_evidencia a boolean
    const esEvidenciaBool = es_evidencia === 'true' || es_evidencia === true;
    
    const result = await pool.query(
      `INSERT INTO observaciones_mantenimiento 
       (mantenimiento_id, descripcion, cargo_a, estado_resolucion, creado_por, 
        imagen_url_1, imagen_nombre_1, imagen_url_2, imagen_nombre_2, imagen_url_3, imagen_nombre_3, es_evidencia)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        mantenimiento_id, 
        descripcion.trim(), 
        cargo_a, 
        estado_resolucion,
        req.user?.id || null, 
        imagen_url_1, 
        imagen_nombre_1,
        imagen_url_2,
        imagen_nombre_2,
        imagen_url_3,
        imagen_nombre_3,
        esEvidenciaBool
      ]
    );

    console.log('✅ Observación guardada correctamente con', req.files?.length || 0, 'imágenes');
    res.json({
      success: true,
      refaccion: result.rows[0],
      message: `Observación agregada correctamente${req.files?.length > 0 ? ` con ${req.files.length} imagen(es)` : ''}`
    });
  } catch (err) {
    console.error("❌ Error agregando refacción:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al agregar refacción" 
    });
  }
});

// BLOQUE 4: Actualizar observación/refacción
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, cargo_a, estado_resolucion, es_evidencia } = req.body;

    console.log('📥 PUT /api/refacciones/' + id + ' recibido');
    console.log('📋 Body fields:', req.body);

    // Verificar que la observación existe
    const observacionCheck = await pool.query(
      'SELECT id FROM observaciones_mantenimiento WHERE id = $1',
      [id]
    );

    if (observacionCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Observación no encontrada" 
      });
    }

    // Convertir es_evidencia a boolean
    const esEvidenciaBool = es_evidencia === 'true' || es_evidencia === true;

    let query = `UPDATE observaciones_mantenimiento 
                 SET descripcion = $1, cargo_a = $2, estado_resolucion = $3, es_evidencia = $4`;
    let params = [descripcion, cargo_a, estado_resolucion, esEvidenciaBool];

    // Si se marca como resuelto, agregar fecha y usuario
    if (estado_resolucion === 'resuelto') {
      query += `, fecha_resolucion = NOW(), resuelto_por = $5`;
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

// BLOQUE 5: Eliminar observación/refacción - ACTUALIZADO PARA 3 IMÁGENES
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Primero obtener la información para eliminar las imágenes
    const observacion = await pool.query(
      'SELECT imagen_url_1, imagen_url_2, imagen_url_3 FROM observaciones_mantenimiento WHERE id = $1',
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

    // Eliminar TODAS las imágenes de AWS S3 si existen
    if (observacion.rows.length > 0) {
      const obs = observacion.rows[0];
      const imagenes = [obs.imagen_url_1, obs.imagen_url_2, obs.imagen_url_3];
      
      for (const imagenUrl of imagenes) {
        if (imagenUrl && imagenUrl.includes('amazonaws.com')) {
          try {
            await deleteFromS3(imagenUrl);
            console.log('✅ Imagen eliminada de AWS S3:', imagenUrl);
          } catch (error) {
            console.error('❌ Error eliminando imagen de S3:', error);
          }
        }
      }
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

// BLOQUE 6: Eliminar imagen específica (1, 2 o 3) - NUEVO
router.delete("/:id/imagen/:numero", async (req, res) => {
  try {
    const { id, numero } = req.params;
    const imagenNum = parseInt(numero);

    if (imagenNum < 1 || imagenNum > 3) {
      return res.status(400).json({ 
        success: false,
        error: "Número de imagen debe ser 1, 2 o 3" 
      });
    }

    // Obtener la observación
    const observacion = await pool.query(
      `SELECT imagen_url_1, imagen_url_2, imagen_url_3 
       FROM observaciones_mantenimiento WHERE id = $1`,
      [id]
    );

    if (observacion.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Observación no encontrada" 
      });
    }

    const campoImagen = `imagen_url_${imagenNum}`;
    const campoNombre = `imagen_nombre_${imagenNum}`;
    const imagenUrl = observacion.rows[0][campoImagen];

    if (!imagenUrl) {
      return res.status(400).json({ 
        success: false,
        error: "No hay imagen para eliminar" 
      });
    }

    // Eliminar imagen de AWS S3
    await deleteFromS3(imagenUrl);
    console.log('✅ Imagen eliminada de AWS S3:', imagenUrl);

    // Actualizar la observación para quitar la imagen específica
    const query = `UPDATE observaciones_mantenimiento 
                   SET ${campoImagen} = NULL, ${campoNombre} = NULL 
                   WHERE id = $1 RETURNING *`;

    const result = await pool.query(query, [id]);

    res.json({
      success: true,
      refaccion: result.rows[0],
      message: `Imagen ${imagenNum} eliminada correctamente`
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