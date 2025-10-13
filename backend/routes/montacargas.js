const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar multer para almacenamiento de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/montacargas';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'montacargas-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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
      'SELECT numero, "Marca", "Modelo", "Serie", "Sistema", "Capacidad", "Ubicacion", "Planta", "documento_pedimento", "documento_adicional" FROM "Montacargas" ORDER BY numero ASC'
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
      'SELECT numero, "Marca", "Modelo", "Serie", "Sistema", "Capacidad", "Ubicacion", "Planta", "documento_pedimento", "documento_adicional" FROM "Montacargas" WHERE numero = $1',
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
  { name: 'documento_adicional', maxCount: 1 }
]), async (req, res) => {
  try {
    const { numero, Marca, Modelo, Serie, Sistema, Capacidad, Ubicacion, Planta } = req.body;
    
    const documentoPedimento = req.files?.documento_pedimento?.[0]?.filename || null;
    const documentoAdicional = req.files?.documento_adicional?.[0]?.filename || null;

    const result = await pool.query(
      'INSERT INTO "Montacargas" (numero, "Marca", "Modelo", "Serie", "Sistema", "Capacidad", "Ubicacion", "Planta", "documento_pedimento", "documento_adicional") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING numero, "Marca", "Modelo", "Serie", "Sistema", "Capacidad", "Ubicacion", "Planta", "documento_pedimento", "documento_adicional"',
      [numero, Marca, Modelo, Serie, Sistema, Capacidad, Ubicacion, Planta, documentoPedimento, documentoAdicional]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/montacargas error:", err);
    res.status(500).json({ error: "Error al crear Montacargas" });
  }
});

// BLOQUE 4: Actualizar montacargas - CORREGIDO
router.put("/:id", upload.fields([
  { name: 'documento_pedimento', maxCount: 1 },
  { name: 'documento_adicional', maxCount: 1 }
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
      'SELECT "documento_pedimento", "documento_adicional" FROM "Montacargas" WHERE numero=$1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "Montacargas no encontrado" });
    }

    let documentoPedimento = currentResult.rows[0].documento_pedimento;
    let documentoAdicional = currentResult.rows[0].documento_adicional;

    console.log('Documentos actuales - pedimento:', documentoPedimento, 'adicional:', documentoAdicional);

    // Actualizar si se suben nuevos archivos
    if (req.files?.documento_pedimento) {
      // Eliminar archivo anterior si existe
      if (documentoPedimento) {
        const oldFilePath = path.join(__dirname, '../uploads/montacargas', documentoPedimento);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log('Archivo anterior de pedimento eliminado:', documentoPedimento);
        }
      }
      documentoPedimento = req.files.documento_pedimento[0].filename;
      console.log('Nuevo archivo de pedimento:', documentoPedimento);
    }
    
    if (req.files?.documento_adicional) {
      // Eliminar archivo anterior si existe
      if (documentoAdicional) {
        const oldFilePath = path.join(__dirname, '../uploads/montacargas', documentoAdicional);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log('Archivo anterior adicional eliminado:', documentoAdicional);
        }
      }
      documentoAdicional = req.files.documento_adicional[0].filename;
      console.log('Nuevo archivo adicional:', documentoAdicional);
    }

    console.log('Valores finales - pedimento:', documentoPedimento, 'adicional:', documentoAdicional);
    console.log('Capacidad procesada:', capacidadNum);

    const result = await pool.query(
      'UPDATE "Montacargas" SET "Marca"=$1, "Modelo"=$2, "Serie"=$3, "Sistema"=$4, "Capacidad"=$5, "Ubicacion"=$6, "Planta"=$7, "documento_pedimento"=$8, "documento_adicional"=$9 WHERE numero=$10 RETURNING numero, "Marca", "Modelo", "Serie", "Sistema", "Capacidad", "Ubicacion", "Planta", "documento_pedimento", "documento_adicional"',
      [Marca, Modelo, Serie, Sistema, capacidadNum, Ubicacion, Planta, documentoPedimento, documentoAdicional, id]
    );

    console.log('Resultado de la consulta UPDATE:', result.rows[0]);

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
      'SELECT "documento_pedimento", "documento_adicional" FROM "Montacargas" WHERE numero=$1',
      [id]
    );

    const result = await pool.query(
      'DELETE FROM "Montacargas" WHERE numero=$1 RETURNING numero',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Montacargas no encontrado" });
    }

    // Eliminar archivos físicos si existen
    if (currentMontacargas.rows[0]?.documento_pedimento) {
      const filePath = path.join(__dirname, '../uploads/montacargas', currentMontacargas.rows[0].documento_pedimento);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (currentMontacargas.rows[0]?.documento_adicional) {
      const filePath = path.join(__dirname, '../uploads/montacargas', currentMontacargas.rows[0].documento_adicional);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
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
router.get("/documento/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/montacargas', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    res.download(filePath);
  } catch (err) {
    console.error("GET /api/montacargas/documento/:filename error:", err);
    res.status(500).json({ error: "Error al descargar archivo" });
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
    } else {
      return res.status(400).json({ error: "Tipo de documento inválido" });
    }

    // Obtener el nombre del archivo antes de eliminarlo
    const current = await pool.query(
      `SELECT "${updateField}" FROM "Montacargas" WHERE numero=$1`,
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: "Montacargas no encontrado" });
    }

    const filename = current.rows[0][updateField];
    console.log('Archivo a eliminar:', filename);

    if (filename) {
      const filePath = path.join(__dirname, '../uploads/montacargas', filename);
      // Eliminar archivo físico
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Archivo físico eliminado:', filePath);
      } else {
        console.log('Archivo físico no encontrado, pero continuando...');
      }
    }

    // Actualizar base de datos
    const result = await pool.query(
      `UPDATE "Montacargas" SET "${updateField}"=NULL WHERE numero=$1 RETURNING numero, "${updateField}"`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Montacargas no encontrado" });
    }

    console.log('=== ELIMINACIÓN EXITOSA ===');
    res.json({ 
      success: true,
      message: "Documento eliminado correctamente" 
    });

  } catch (err) {
    console.error("DELETE /api/montacargas/documento/:id/:tipo error:", err);
    console.error("Error detallado:", err.message);
    res.status(500).json({ 
      error: "Error al eliminar documento",
      details: err.message 
    });
  }
});

//BLOQUE NUEVO 
// GET - Obtener todas las refacciones de un montacargas
router.get("/:id/refacciones", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM refacciones_montacargas 
       WHERE montacargas_id = $1 
       ORDER BY creado_en DESC`,
      [id]
    );

    // Calcular totales
    const totalRefacciones = result.rows.reduce((sum, item) => sum + item.cantidad, 0);
    const costoTotal = result.rows.reduce((sum, item) => sum + (item.costo_unitario * item.cantidad), 0);

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

// POST - Agregar nueva refacción
router.post("/:id/refacciones", async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, numero_parte, cantidad, costo_unitario } = req.body;

    // Validaciones
    if (!descripcion || !costo_unitario) {
      return res.status(400).json({ error: "Descripción y costo son requeridos" });
    }

    const result = await pool.query(
      `INSERT INTO refacciones_montacargas 
       (montacargas_id, descripcion, numero_parte, cantidad, costo_unitario) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [id, descripcion, numero_parte || null, cantidad || 1, costo_unitario]
    );

    res.json({
      success: true,
      message: "Refacción agregada correctamente",
      refaccion: result.rows[0]
    });
  } catch (error) {
    console.error("Error agregando refacción:", error);
    res.status(500).json({ error: "Error del servidor" });
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