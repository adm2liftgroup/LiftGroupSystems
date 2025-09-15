const express = require("express");
const router = express.Router();
const pool = require("../db");

// Función para determinar el tipo de mantenimiento según el mes
function getTipoMantenimiento(mes) {
  const mesNum = parseInt(mes);
  
  if (mesNum === 12) return "Avanzado";
  if (mesNum === 3 || mesNum === 6 || mesNum === 9) return "Intermedio";
  return "Básico";
}

// ======================
// Obtener mantenimientos por año
// ======================
router.get("/", async (req, res) => {
  try {
    console.log("GET /api/mantenimientos - Query params:", req.query);
    
    const { anio, montacargasId } = req.query;

    if (!anio || !montacargasId) {
      return res.status(400).json({ success: false, error: "anio y montacargasId son requeridos" });
    }

    const anioNum = parseInt(anio);
    const montacargasIdNum = parseInt(montacargasId);

    if (isNaN(anioNum) || isNaN(montacargasIdNum)) {
      return res.status(400).json({ 
        success: false, 
        error: "anio y montacargasId deben ser números válidos" 
      });
    }

    const result = await pool.query(
      `SELECT id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, creado_en 
       FROM mantenimientos_programados 
       WHERE montacargas_id = $1 AND anio = $2 
       ORDER BY mes`,
      [montacargasIdNum, anioNum]
    );

    res.json({ success: true, mantenimientos: result.rows });
  } catch (err) {
    console.error("Error obteniendo mantenimientos:", err);
    res.status(500).json({ success: false, error: "Error al obtener mantenimientos" });
  }
});

// ======================
// Obtener TODOS los mantenimientos de un montacargas
// ======================
router.get("/todos", async (req, res) => {
  try {
    console.log("GET /api/mantenimientos/todos - Query params:", req.query);
    
    const { montacargasId } = req.query;

    if (!montacargasId) {
      return res.status(400).json({ success: false, error: "montacargasId es requerido" });
    }

    const montacargasIdNum = parseInt(montacargasId);

    if (isNaN(montacargasIdNum)) {
      return res.status(400).json({ 
        success: false, 
        error: "montacargasId debe ser un número válido" 
      });
    }

    const result = await pool.query(
      `SELECT id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, creado_en 
       FROM mantenimientos_programados 
       WHERE montacargas_id = $1 
       ORDER BY anio DESC, mes ASC`,
      [montacargasIdNum]
    );

    console.log(`Encontrados ${result.rows.length} mantenimientos para montacargas ${montacargasIdNum}`);
    res.json({ success: true, mantenimientos: result.rows });
  } catch (err) {
    console.error("Error obteniendo todos los mantenimientos:", err);
    res.status(500).json({ success: false, error: "Error al obtener mantenimientos" });
  }
});

// ======================
// Crear mantenimientos anuales AUTOMÁTICOS
// ======================
router.post("/", async (req, res) => {
  try {
    console.log("POST /api/mantenimientos - Body:", req.body);
    
    const { anio, dia, montacargasId } = req.body;

    if (!anio || !dia || !montacargasId) {
      return res.status(400).json({ success: false, error: "anio, dia y montacargasId son requeridos" });
    }

    const anioNum = parseInt(anio);
    const diaNum = parseInt(dia);
    const montacargasIdNum = parseInt(montacargasId);

    if (isNaN(anioNum) || isNaN(diaNum) || isNaN(montacargasIdNum)) {
      return res.status(400).json({ 
        success: false, 
        error: "Los valores deben ser números válidos" 
      });
    }

    if (diaNum < 1 || diaNum > 28) {
      return res.status(400).json({ 
        success: false, 
        error: "El día debe estar entre 1 y 28" 
      });
    }

    // Verificar si el montacargas existe
    const montacargasExiste = await pool.query(
      "SELECT numero FROM \"Montacargas\" WHERE numero = $1",
      [montacargasIdNum]
    );

    if (montacargasExiste.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: `El montacargas con número ${montacargasIdNum} no existe` 
      });
    }

    // Verificar si ya existe programa para este año y montacargas
    const existente = await pool.query(
      "SELECT id FROM mantenimientos_programados WHERE montacargas_id = $1 AND anio = $2",
      [montacargasIdNum, anioNum]
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Ya existe un programa de mantenimiento para el montacargas ${montacargasIdNum} en el año ${anioNum}` 
      });
    }

    const mantenimientos = [];
    
    for (let mes = 1; mes <= 12; mes++) {
      const fecha = new Date(anioNum, mes - 1, diaNum);
      const tipo = getTipoMantenimiento(mes);
      
      try {
        const result = await pool.query(
          `INSERT INTO mantenimientos_programados 
           (montacargas_id, mes, anio, tipo, fecha) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, creado_en`,
          [montacargasIdNum, mes, anioNum, tipo, fecha]
        );
        mantenimientos.push(result.rows[0]);
      } catch (err) {
        console.error(`Error insertando mes ${mes}:`, err);
        // Rollback de los inserts anteriores
        for (let i = 1; i < mes; i++) {
          await pool.query(
            "DELETE FROM mantenimientos_programados WHERE montacargas_id = $1 AND anio = $2 AND mes = $3",
            [montacargasIdNum, anioNum, i]
          );
        }
        throw err;
      }
    }

    res.json({ 
      success: true, 
      message: "Programa anual creado automáticamente",
      mantenimientos 
    });
  } catch (err) {
    console.error("Error registrando programa:", err);
    res.status(500).json({ success: false, error: "Error al registrar programa" });
  }
});

// ======================
// Crear mantenimiento manual para un mes específico
// ======================
router.post("/manual", async (req, res) => {
  try {
    console.log("POST /api/mantenimientos/manual - Body:", req.body);
    
    const { anio, mes, dia, montacargasId, tipo } = req.body;

    if (!anio || !mes || !dia || !montacargasId || !tipo) {
      return res.status(400).json({ 
        success: false, 
        error: "Todos los campos son requeridos: anio, mes, dia, montacargasId, tipo" 
      });
    }

    const anioNum = parseInt(anio);
    const mesNum = parseInt(mes);
    const diaNum = parseInt(dia);
    const montacargasIdNum = parseInt(montacargasId);

    if (isNaN(anioNum) || isNaN(mesNum) || isNaN(diaNum) || isNaN(montacargasIdNum)) {
      return res.status(400).json({ 
        success: false, 
        error: "Todos los valores deben ser números válidos" 
      });
    }

    const fecha = new Date(anioNum, mesNum - 1, diaNum);
    
    // Verificar si ya existe mantenimiento para este mes
    const existente = await pool.query(
      "SELECT id FROM mantenimientos_programados WHERE montacargas_id = $1 AND anio = $2 AND mes = $3",
      [montacargasIdNum, anioNum, mesNum]
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Ya existe un mantenimiento programado para el mes ${mesNum} del año ${anioNum}` 
      });
    }

    const result = await pool.query(
      `INSERT INTO mantenimientos_programados 
       (montacargas_id, mes, anio, tipo, fecha) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, creado_en`,
      [montacargasIdNum, mesNum, anioNum, tipo, fecha]
    );

    res.json({ 
      success: true, 
      message: `Mantenimiento ${tipo} creado para el mes ${mesNum}`,
      mantenimiento: result.rows[0]
    });
  } catch (err) {
    console.error("Error creando mantenimiento manual:", err);
    res.status(500).json({ success: false, error: "Error al crear mantenimiento manual" });
  }
});

// ======================
// Eliminar mantenimiento
// ======================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM mantenimientos_programados WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Mantenimiento no encontrado" });
    }

    res.json({ success: true, message: "Mantenimiento eliminado correctamente", id: result.rows[0].id });
  } catch (err) {
    console.error("Error eliminando mantenimiento:", err);
    res.status(500).json({ success: false, error: "Error al eliminar mantenimiento" });
  }
});

// ======================
// Actualizar mantenimiento
// ======================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, fecha, tecnico_id } = req.body;

    const result = await pool.query(
      `UPDATE mantenimientos_programados 
       SET tipo = $1, fecha = $2, tecnico_id = $3 
       WHERE id = $4 
       RETURNING id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, creado_en`,
      [tipo, fecha, tecnico_id, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Mantenimiento no encontrado" });
    }

    res.json({ success: true, mantenimiento: result.rows[0] });
  } catch (err) {
    console.error("Error actualizando mantenimiento:", err);
    res.status(500).json({ success: false, error: "Error al actualizar mantenimiento" });
  }
});

module.exports = router;