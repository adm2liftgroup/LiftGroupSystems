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

// BLOQUE 1: Obtener mantenimientos por año - MODIFICADO
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

    // MODIFICACIÓN: Incluir campos de status, tecnico_nombre, observaciones, completado_en
    const result = await pool.query(
      `SELECT id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, tecnico_nombre, 
              status, creado_en, completado_en, observaciones
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
// FIN BLOQUE 1: Obtener mantenimientos por año

// BLOQUE 2: Obtener todos los mantenimientos de un montacargas - MODIFICADO
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

    // MODIFICACIÓN: Incluir campos de status y observaciones
    const result = await pool.query(
      `SELECT id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, tecnico_nombre,
              status, creado_en, completado_en, observaciones
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
// FIN DEL BLOQUE 2: Obtener todos los mantenimientos de un montacargas

// BLOQUE 3: Crear mantenimientos anuales automáticos - SIN CAMBIOS
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
           RETURNING id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, creado_en, status`,
          [montacargasIdNum, mes, anioNum, tipo, fecha]
        );
        mantenimientos.push(result.rows[0]);
      } catch (err) {
        console.error(`Error insertando mes ${mes}:`, err);
        // Rollback en caso de error
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
// FIN DEL BLOQUE 3: Crear mantenimientos anuales automáticos 

// BLOQUE 4: Crear mantenimiento manual para un mes específico - SIN CAMBIOS
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
       RETURNING id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, creado_en, status`,
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
// FIN DEL BLOQUE 4: Crear mantenimiento manual para un mes específico

// BLOQUE 5: Eliminar mantenimiento - SIN CAMBIOS
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
// FIN DEL BLOQUE 5: Eliminar mantenimiento

// BLOQUE 6: Actualizar mantenimiento - MODIFICADO
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, fecha, tecnico_id, tecnico_nombre, observaciones } = req.body;

    console.log("Datos recibidos para actualizar:", { id, tipo, fecha, tecnico_id, tecnico_nombre, observaciones });

    // Validar campos requeridos
    if (!tipo || !fecha) {
      return res.status(400).json({ 
        success: false, 
        error: "Tipo y fecha son campos requeridos" 
      });
    }

    // Validar formato de fecha
    const fechaValida = new Date(fecha);
    if (isNaN(fechaValida.getTime())) {
      return res.status(400).json({ 
        success: false, 
        error: "Formato de fecha inválido" 
      });
    }

    // Extraer mes y año de la fecha
    const mes = fechaValida.getMonth() + 1;
    const anio = fechaValida.getFullYear();

    // Procesar tecnico_id
    let tecnicoIdValido = null;
    if (tecnico_id !== undefined && tecnico_id !== null && tecnico_id !== "") {
      const tecnicoIdParsed = parseInt(tecnico_id);
      if (!isNaN(tecnicoIdParsed)) {
        tecnicoIdValido = tecnicoIdParsed;
      } else {
        return res.status(400).json({ 
          success: false, 
          error: "El ID del técnico debe ser un número válido" 
        });
      }
    }

    console.log("Datos validados para actualizar:", { 
      tipo, fecha, mes, anio, tecnico_id: tecnicoIdValido, tecnico_nombre, observaciones, id 
    });

    const result = await pool.query(
      `UPDATE mantenimientos_programados 
       SET tipo = $1, fecha = $2, mes = $3, anio = $4, tecnico_id = $5, 
           tecnico_nombre = $6, observaciones = $7
       WHERE id = $8 
       RETURNING id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, 
                 tecnico_nombre, status, creado_en, completado_en, observaciones`,
      [tipo, fecha, mes, anio, tecnicoIdValido, tecnico_nombre, observaciones, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Mantenimiento no encontrado" 
      });
    }

    res.json({ 
      success: true, 
      mantenimiento: result.rows[0],
      message: "Mantenimiento actualizado correctamente"
    });

  } catch (err) {
    console.error("Error actualizando mantenimiento:", err);
    
    if (err.code === '22P02') {
      return res.status(400).json({ 
        success: false,
        error: "Error de tipo de datos: Verifica que el ID del técnico sea un número válido" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: "Error interno del servidor al actualizar mantenimiento" 
    });
  }
});
// FIN DEL BLOQUE 6: Actualizar mantenimiento

// BLOQUE 7: Obtener mantenimientos del mes actual - MODIFICADO
router.get("/mes-actual", async (req, res) => {
  try {
    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();

    const result = await pool.query(
      `SELECT mp.*, m.numero as montacargas_numero, m.marca, m.modelo
       FROM mantenimientos_programados mp
       JOIN "Montacargas" m ON mp.montacargas_id = m.numero
       WHERE mp.mes = $1 AND mp.anio = $2
       ORDER BY mp.fecha`,
      [mesActual, anioActual]
    );

    res.json({ success: true, mantenimientos: result.rows });
  } catch (err) {
    console.error("Error obteniendo mantenimientos del mes:", err);
    res.status(500).json({ success: false, error: "Error al obtener mantenimientos" });
  }
});
// FIN DEL BLOQUE 7: Obtener mantenimientos del mes actual

// NUEVO BLOQUE 8: Actualizar estado del mantenimiento
router.patch("/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tecnico_id, tecnico_nombre, observaciones } = req.body;

    console.log("Actualizando estado del mantenimiento:", { id, status, tecnico_id, tecnico_nombre, observaciones });

    // Validar que el estado sea válido
    const estadosValidos = ['pendiente', 'completado', 'cancelado'];
    if (!status || !estadosValidos.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}` 
      });
    }

    // Procesar tecnico_id
    let tecnicoIdValido = null;
    if (tecnico_id !== undefined && tecnico_id !== null && tecnico_id !== "") {
      const tecnicoIdParsed = parseInt(tecnico_id);
      if (!isNaN(tecnicoIdParsed)) {
        tecnicoIdValido = tecnicoIdParsed;
      } else {
        return res.status(400).json({ 
          success: false, 
          error: "El ID del técnico debe ser un número válido" 
        });
      }
    }

    // Preparar campos para actualización
    let query = `UPDATE mantenimientos_programados 
                 SET status = $1, tecnico_id = $2, tecnico_nombre = $3, observaciones = $4`;
    let params = [status, tecnicoIdValido, tecnico_nombre, observaciones];

    // Si se marca como completado, agregar fecha de completado
    if (status === 'completado') {
      query += `, completado_en = NOW()`;
    } else if (status === 'pendiente') {
      query += `, completado_en = NULL`;
    }

    query += ` WHERE id = $${params.length + 1} 
              RETURNING id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, 
                        tecnico_nombre, status, creado_en, completado_en, observaciones`;
    
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Mantenimiento no encontrado" 
      });
    }

    res.json({ 
      success: true, 
      mantenimiento: result.rows[0],
      message: `Mantenimiento ${status} correctamente`
    });

  } catch (err) {
    console.error("Error actualizando estado del mantenimiento:", err);
    
    if (err.code === '22P02') {
      return res.status(400).json({ 
        success: false,
        error: "Error de tipo de datos: Verifica que el ID del técnico sea un número válido" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: "Error interno del servidor al actualizar estado" 
    });
  }
});
// FIN NUEVO BLOQUE 8: Actualizar estado del mantenimiento

// NUEVO BLOQUE 9: Obtener mantenimientos por estado
router.get("/estado/:status", async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validar estado
    const estadosValidos = ['pendiente', 'completado', 'cancelado'];
    if (!estadosValidos.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}` 
      });
    }

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT mp.*, m.numero as montacargas_numero, m.marca, m.modelo
       FROM mantenimientos_programados mp
       JOIN "Montacargas" m ON mp.montacargas_id = m.numero
       WHERE mp.status = $1
       ORDER BY mp.fecha DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );

    // Obtener total count para paginación
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM mantenimientos_programados WHERE status = $1`,
      [status]
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({ 
      success: true, 
      mantenimientos: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error("Error obteniendo mantenimientos por estado:", err);
    res.status(500).json({ success: false, error: "Error al obtener mantenimientos" });
  }
});
// FIN NUEVO BLOQUE 9: Obtener mantenimientos por estado

module.exports = router;