const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadToSupabase, deleteFromSupabase } = require('../supabase-storage');

// Configurar multer para almacenamiento de archivos
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF, Word y texto'));
    }
  }
});

// BLOQUE 1: Obtener todos los montacargas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT numero, "Marca", "Modelo", "Serie", "Sistema", "Capacidad", "Ubicacion", "Planta", "documento_pedimento", "documento_adicional", "doc_ped_adicional" FROM "Montacargas" ORDER BY numero ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/montacargas error:", err);
    res.status(500).json({ error: "Error al obtener Montacargas" });
  }
});

// BLOQUE 2: Obtener un montacargas específico por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT numero, "Marca", "Modelo", "Serie", "Sistema", "Capacidad", "Ubicacion", "Planta", "documento_pedimento", "documento_adicional", "doc_ped_adicional" FROM "Montacargas" WHERE numero = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Montacargas no encontrado" });
    }

    res.json({ success: true, montacargas: result.rows[0] });
  } catch (err) {
    console.error("GET /api/montacargas/:id error:", err);
    res.status(500).json({ error: "Error al obtener Montacargas" });
  }
});

// BLOQUE 3: Crear montacargas
router.post("/", upload.fields([
  { name: 'documento_pedimento', maxCount: 1 },
  { name: 'documento_adicional', maxCount: 1 },
  { name: 'doc_ped_adicional', maxCount: 1 }
]), async (req, res) => {
  try {
    const { numero, Marca, Modelo, Serie, Sistema, Capacidad, Ubicacion, Planta } = req.body;
    
    let documentoPedimento = null;
    let documentoAdicional = null;
    let docPedAdicional = null;

    console.log('📁 Archivos recibidos:', req.files);
    
    // CAMBIO: Subir a Supabase en lugar de Cloudinary
    if (req.files?.documento_pedimento) {
      try {
        const file = req.files.documento_pedimento[0];
        console.log(`📤 Subiendo documento_pedimento: ${file.originalname}`);
        documentoPedimento = await uploadToSupabase(file.buffer, file.originalname, file.mimetype);
        console.log('✅ documento_pedimento subido:', documentoPedimento);
      } catch (error) {
        console.error('❌ Error subiendo documento_pedimento:', error);
        // Continuar sin el documento
      }
    }
    
    if (req.files?.documento_adicional) {
      try {
        const file = req.files.documento_adicional[0];
        console.log(`📤 Subiendo documento_adicional: ${file.originalname}`);
        documentoAdicional = await uploadToSupabase(file.buffer, file.originalname, file.mimetype);
        console.log('✅ documento_adicional subido:', documentoAdicional);
      } catch (error) {
        console.error('❌ Error subiendo documento_adicional:', error);
        // Continuar sin el documento
      }
    }
    
    if (req.files?.doc_ped_adicional) {
      try {
        const file = req.files.doc_ped_adicional[0];
        console.log(`📤 Subiendo doc_ped_adicional: ${file.originalname}`);
        docPedAdicional = await uploadToSupabase(file.buffer, file.originalname, file.mimetype);
        console.log('✅ doc_ped_adicional subido:', docPedAdicional);
      } catch (error) {
        console.error('❌ Error subiendo doc_ped_adicional:', error);
        // Continuar sin el documento
      }
    }

    // Resto del código igual...
    console.log('💾 Guardando en BD:');
    console.log('   - documento_pedimento:', documentoPedimento);
    console.log('   - documento_adicional:', documentoAdicional);
    console.log('   - doc_ped_adicional:', docPedAdicional);

    const result = await pool.query(
      'INSERT INTO "Montacargas" (numero, "Marca", "Modelo", "Serie", "Sistema", "Capacidad", "Ubicacion", "Planta", "documento_pedimento", "documento_adicional", "doc_ped_adicional") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING numero, "Marca", "Modelo", "Serie", "Sistema", "Capacidad", "Ubicacion", "Planta", "documento_pedimento", "documento_adicional", "doc_ped_adicional"',
      [numero, Marca, Modelo, Serie, Sistema, Capacidad, Ubicacion, Planta, documentoPedimento, documentoAdicional, docPedAdicional]
    );

    console.log('📊 Resultado de INSERT en BD:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/montacargas error:", err);
    res.status(500).json({ error: "Error al crear Montacargas" });
  }
});

// BLOQUE 4: Actualizar montacargas - CORREGIDO
router.put("/:id", upload.fields([
  { name: 'documento_pedimento', maxCount: 1 },
  { name: 'documento_adicional', maxCount: 1 }, 
  { name: 'doc_ped_adicional', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('=== INICIANDO ACTUALIZACIÓN ===');
    console.log('Params:', req.params);
    console.log('Body fields:', req.body);
    console.log('Files received:', req.files);

    const { id } = req.params;
    const { Marca, Modelo, Serie, Sistema, Capacidad, Ubicacion, Planta } = req.body;
    
    // VALIDACIÓN: Asegurar que Capacidad sea un número válido
    let capacidadNum = 0;
    if (Capacidad !== undefined && Capacidad !== null && Capacidad !== '') {
      capacidadNum = parseInt(Capacidad);
      if (isNaN(capacidadNum)) {
        return res.status(400).json({ 
          error: "La capacidad debe ser un número válido" 
        });
      }
    }

    // Primero obtener el montacargas actual
    const currentResult = await pool.query(
      'SELECT "documento_pedimento", "documento_adicional", "doc_ped_adicional" FROM "Montacargas" WHERE numero=$1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "Montacargas no encontrado" });
    }

    let documentoPedimento = currentResult.rows[0].documento_pedimento;
    let documentoAdicional = currentResult.rows[0].documento_adicional;
    let docPedAdicional = currentResult.rows[0].doc_ped_adicional;

    console.log('📄 Documentos actuales en BD:');
    console.log('   - pedimento:', documentoPedimento);
    console.log('   - adicional:', documentoAdicional);
    console.log('   - ped_adicional:', docPedAdicional);

    // CAMBIO: Manejar archivos con Supabase en lugar de Cloudinary
    if (req.files?.documento_pedimento) {
      try {
        // PRIMERO eliminar el archivo anterior de Supabase si existe
        if (documentoPedimento && documentoPedimento.includes('supabase.co')) {
          try {
            await deleteFromSupabase(documentoPedimento);
            console.log('✅ Archivo anterior de pedimento eliminado de Supabase');
          } catch (error) {
            console.error('⚠️ Error eliminando archivo anterior de pedimento, pero continuando:', error.message);
          }
        } else if (documentoPedimento) {
          // Si es un archivo local antiguo, eliminarlo localmente
          const oldFilePath = path.join(__dirname, '../uploads/montacargas', documentoPedimento);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log('🗑️ Archivo anterior local eliminado:', documentoPedimento);
          }
        }
        
        // SUBIR nuevo archivo a Supabase
        const file = req.files.documento_pedimento[0];
        console.log(`📤 Subiendo nuevo documento_pedimento: ${file.originalname}`);
        documentoPedimento = await uploadToSupabase(file.buffer, file.originalname, file.mimetype);
        console.log('☁️ Nuevo archivo de pedimento (Supabase):', documentoPedimento);
      } catch (error) {
        console.error('❌ Error subiendo nuevo documento_pedimento:', error);
        // Mantener el documento anterior si hay error
      }
    }
    
    if (req.files?.documento_adicional) {
      try {
        // PRIMERO eliminar el archivo anterior de Supabase si existe
        if (documentoAdicional && documentoAdicional.includes('supabase.co')) {
          try {
            await deleteFromSupabase(documentoAdicional);
            console.log('✅ Archivo anterior adicional eliminado de Supabase');
          } catch (error) {
            console.error('⚠️ Error eliminando archivo anterior adicional, pero continuando:', error.message);
          }
        } else if (documentoAdicional) {
          // Si es un archivo local antiguo, eliminarlo localmente
          const oldFilePath = path.join(__dirname, '../uploads/montacargas', documentoAdicional);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log('🗑️ Archivo anterior local eliminado:', documentoAdicional);
          }
        }
        
        // SUBIR nuevo archivo a Supabase
        const file = req.files.documento_adicional[0];
        console.log(`📤 Subiendo nuevo documento_adicional: ${file.originalname}`);
        documentoAdicional = await uploadToSupabase(file.buffer, file.originalname, file.mimetype);
        console.log('☁️ Nuevo archivo adicional (Supabase):', documentoAdicional);
      } catch (error) {
        console.error('❌ Error subiendo nuevo documento_adicional:', error);
        // Mantener el documento anterior si hay error
      }
    }

    if (req.files?.doc_ped_adicional) {
      try {
        // PRIMERO eliminar el archivo anterior de Supabase si existe
        if (docPedAdicional && docPedAdicional.includes('supabase.co')) {
          try {
            await deleteFromSupabase(docPedAdicional);
            console.log('✅ Archivo anterior ped_adicional eliminado de Supabase');
          } catch (error) {
            console.error('⚠️ Error eliminando archivo anterior ped_adicional, pero continuando:', error.message);
          }
        } else if (docPedAdicional) {
          // Si es un archivo local antiguo, eliminarlo localmente
          const oldFilePath = path.join(__dirname, '../uploads/montacargas', docPedAdicional);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log('🗑️ Archivo anterior local eliminado:', docPedAdicional);
          }
        }
        
        // SUBIR nuevo archivo a Supabase
        const file = req.files.doc_ped_adicional[0];
        console.log(`📤 Subiendo nuevo doc_ped_adicional: ${file.originalname}`);
        docPedAdicional = await uploadToSupabase(file.buffer, file.originalname, file.mimetype);
        console.log('☁️ Nuevo archivo ped_adicional (Supabase):', docPedAdicional);
      } catch (error) {
        console.error('❌ Error subiendo nuevo doc_ped_adicional:', error);
        // Mantener el documento anterior si hay error
      }
    }

    // Resto del código igual...
    console.log('💾 Valores finales para guardar en BD:');
    console.log('   - pedimento:', documentoPedimento);
    console.log('   - adicional:', documentoAdicional);
    console.log('   - ped_adicional:', docPedAdicional);
    console.log('   - Capacidad procesada:', capacidadNum);

    const result = await pool.query(
      'UPDATE "Montacargas" SET "Marca"=$1, "Modelo"=$2, "Serie"=$3, "Sistema"=$4, "Capacidad"=$5, "Ubicacion"=$6, "Planta"=$7, "documento_pedimento"=$8, "documento_adicional"=$9, "doc_ped_adicional"=$10 WHERE numero=$11 RETURNING numero, "Marca", "Modelo", "Serie", "Sistema", "Capacidad", "Ubicacion", "Planta", "documento_pedimento", "documento_adicional", "doc_ped_adicional"',
      [Marca, Modelo, Serie, Sistema, capacidadNum, Ubicacion, Planta, documentoPedimento, documentoAdicional, docPedAdicional, id]
    );

    console.log('📊 Resultado de UPDATE en BD:', result.rows[0]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Montacargas no encontrado" });
    }

    console.log('=== ACTUALIZACIÓN EXITOSA ===');
    res.json({
      success: true,
      ...result.rows[0]
    });

  } catch (err) {
    console.error("PUT /api/montacargas/:id error:", err);
    console.error("Error detallado:", err.message);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ 
      error: "Error al actualizar Montacargas",
      details: err.message 
    });
  }
});

// BLOQUE 5: Eliminar montacargas
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener información de archivos antes de eliminar
    const currentMontacargas = await pool.query(
      'SELECT "documento_pedimento", "documento_adicional", "doc_ped_adicional" FROM "Montacargas" WHERE numero=$1',
      [id]
    );

    const result = await pool.query(
      'DELETE FROM "Montacargas" WHERE numero=$1 RETURNING numero',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Montacargas no encontrado" });
    }

    // CAMBIO: Eliminar archivos de Supabase si existen
    const documentos = currentMontacargas.rows[0];
    if (documentos) {
      // Eliminar de Supabase si son URLs de Supabase
      if (documentos.documento_pedimento && documentos.documento_pedimento.includes('supabase.co')) {
        await deleteFromSupabase(documentos.documento_pedimento);
        console.log('✅ documento_pedimento eliminado de Supabase');
      }
      
      if (documentos.documento_adicional && documentos.documento_adicional.includes('supabase.co')) {
        await deleteFromSupabase(documentos.documento_adicional);
        console.log('✅ documento_adicional eliminado de Supabase');
      }
      
      if (documentos.doc_ped_adicional && documentos.doc_ped_adicional.includes('supabase.co')) {
        await deleteFromSupabase(documentos.doc_ped_adicional);
        console.log('✅ doc_ped_adicional eliminado de Supabase');
      }

      // También eliminar archivos locales antiguos si existen (para desarrollo)
      const documentosLocales = [
        documentos.documento_pedimento,
        documentos.documento_adicional,
        documentos.doc_ped_adicional
      ];

      documentosLocales.forEach(filename => {
        if (filename && !filename.includes('supabase.co') && !filename.includes('cloudinary')) {
          const filePath = path.join(__dirname, '../uploads/montacargas', filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('🗑️ Archivo local eliminado:', filename);
          }
        }
      });
    }

    res.json({ 
      success: true,
      message: "Montacargas eliminado correctamente", 
      numero: result.rows[0].numero 
    });
  } catch (err) {
    console.error("DELETE /api/montacargas/:id error:", err);
    res.status(500).json({ error: "Error al eliminar Montacargas" });
  }
});

// BLOQUE 6: Descargar documento
router.get("/documento/:url", async (req, res) => {
  try {
    const { url } = req.params;
    const fileUrl = decodeURIComponent(url || "");
    console.log('📥 Redirigiendo a:', fileUrl);

    if (!fileUrl) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    // Redirigir directamente a la URL (funciona para Supabase y archivos locales)
    res.redirect(fileUrl);

  } catch (err) {
    console.error("❌ GET /api/montacargas/documento/:url error:", err);
    res.status(500).json({ 
      error: "Error al descargar archivo",
      details: err.message 
    });
  }
});

// BLOQUE 7: Eliminar documento - CORREGIDO
router.delete("/documento/:id/:tipo", async (req, res) => {
  try {
    console.log('=== INICIANDO ELIMINACIÓN DE DOCUMENTO ===');
    console.log('ID:', req.params.id, 'Tipo:', req.params.tipo);

    const { id, tipo } = req.params;
    
    let updateField = '';
    
    if (tipo === 'pedimento') {
      updateField = 'documento_pedimento';
    } else if (tipo === 'adicional') {
      updateField = 'documento_adicional';
    } else if (tipo === 'ped_adicional') { 
      updateField = 'doc_ped_adicional';
    } else {
      return res.status(400).json({ error: "Tipo de documento inválido" });
    }

    // PRIMERO obtener la URL actual
    const current = await pool.query(
      `SELECT "${updateField}" FROM "Montacargas" WHERE numero=$1`,
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: "Montacargas no encontrado" });
    }

    const fileUrl = current.rows[0][updateField];
    console.log('📄 URL a eliminar:', fileUrl);

    // CAMBIO: Eliminar de Supabase SI existe
    if (fileUrl && fileUrl.includes('supabase.co')) {
      console.log('🗑️ Eliminando de Supabase...');
      try {
        await deleteFromSupabase(fileUrl);
        console.log('✅ Archivo eliminado de Supabase');
      } catch (supabaseError) {
        console.error('❌ Error eliminando de Supabase:', supabaseError);
        // CONTINUAR aunque falle Supabase
      }
    }

    // ACTUALIZAR base de datos a NULL
    console.log('🗄️ Actualizando base de datos...');
    const result = await pool.query(
      `UPDATE "Montacargas" SET "${updateField}"=NULL WHERE numero=$1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Montacargas no encontrado" });
    }

    console.log('✅ Base de datos actualizada correctamente');
    console.log('=== ELIMINACIÓN EXITOSA ===');
    
    res.json({ 
      success: true,
      message: "Documento eliminado correctamente",
      montacargas: result.rows[0]
    });

  } catch (err) {
    console.error("❌ DELETE /api/montacargas/documento/:id/:tipo error:", err);
    console.error("📝 Error detallado:", err.message);
    res.status(500).json({ 
      error: "Error al eliminar documento",
      details: err.message 
    });
  }
});

// BLOQUE 8: Rutas para refacciones de montacargas

// GET - Obtener todas las refacciones de un montacargas
router.get("/:id/refacciones", async (req, res) => {
  try {
    const { id } = req.params;
    
    // VALIDACIÓN CRÍTICA: Verificar que el ID sea un número válido
    const montacargasId = parseInt(id);
    if (isNaN(montacargasId)) {
      return res.status(400).json({ 
        error: "ID de montacargas inválido" 
      });
    }

    console.log('Buscando refacciones para montacargas ID:', montacargasId);
    
    const result = await pool.query(
      `SELECT * FROM refacciones_montacargas 
       WHERE montacargas_id = $1 
       ORDER BY creado_en DESC`,
      [montacargasId]
    );

    // Calcular totales
    const totalRefacciones = result.rows.reduce((sum, item) => sum + item.cantidad, 0);
    const costoTotal = result.rows.reduce((sum, item) => sum + (parseFloat(item.costo_unitario) * item.cantidad), 0);

    res.json({
      success: true,
      refacciones: result.rows,
      totales: {
        totalRefacciones,
        costoTotal: parseFloat(costoTotal.toFixed(2))
      }
    });
  } catch (error) {
    console.error("Error obteniendo refacciones:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// POST - Agregar nueva refacción (SOLO UNA VEZ)
router.post("/:id/refacciones", async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, numero_parte, cantidad, costo_unitario } = req.body;

    // VALIDACIÓN CRÍTICA: Verificar que el ID sea un número válido
    const montacargasId = parseInt(id);
    if (isNaN(montacargasId)) {
      return res.status(400).json({ 
        error: "ID de montacargas inválido" 
      });
    }

    // Validaciones de campos requeridos
    if (!descripcion || !costo_unitario) {
      return res.status(400).json({ error: "Descripción y costo son requeridos" });
    }

    // Validar que el costo sea un número
    const costo = parseFloat(costo_unitario);
    if (isNaN(costo)) {
      return res.status(400).json({ error: "El costo debe ser un número válido" });
    }

    console.log('Agregando refacción para montacargas ID:', montacargasId);
    console.log('Datos recibidos:', { descripcion, numero_parte, cantidad, costo_unitario: costo });

    const result = await pool.query(
      `INSERT INTO refacciones_montacargas 
       (montacargas_id, descripcion, numero_parte, cantidad, costo_unitario) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [montacargasId, descripcion, numero_parte || null, cantidad || 1, costo]
    );

    res.json({
      success: true,
      message: "Refacción agregada correctamente",
      refaccion: result.rows[0]
    });
  } catch (error) {
    console.error("Error agregando refacción:", error);
    console.error("Detalles del error:", error.message);
    res.status(500).json({ 
      error: "Error del servidor",
      details: error.message 
    });
  }
});

// PUT - Actualizar refacción
router.put("/refacciones/:refaccionId", async (req, res) => {
  try {
    const { refaccionId } = req.params;
    const { descripcion, numero_parte, cantidad, costo_unitario } = req.body;

    const result = await pool.query(
      `UPDATE refacciones_montacargas 
       SET descripcion = $1, numero_parte = $2, cantidad = $3, 
           costo_unitario = $4, actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING *`,
      [descripcion, numero_parte, cantidad, costo_unitario, refaccionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Refacción no encontrada" });
    }

    res.json({
      success: true,
      message: "Refacción actualizada correctamente",
      refaccion: result.rows[0]
    });
  } catch (error) {
    console.error("Error actualizando refacción:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// DELETE - Eliminar refacción
router.delete("/refacciones/:refaccionId", async (req, res) => {
  try {
    const { refaccionId } = req.params;

    const result = await pool.query(
      "DELETE FROM refacciones_montacargas WHERE id = $1 RETURNING *",
      [refaccionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Refacción no encontrada" });
    }

    res.json({
      success: true,
      message: "Refacción eliminada correctamente"
    });
  } catch (error) {
    console.error("Error eliminando refacción:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;