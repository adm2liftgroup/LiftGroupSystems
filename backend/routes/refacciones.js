const express = require("express");
const router = express.Router();
const pool = require("../db");

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

// BLOQUE 3: Agregar nueva observación/refacción (MEJORADO)
router.post("/", async (req, res) => {
  try {
    const { 
      mantenimiento_id, 
      descripcion,
      cargo_a = 'empresa'
    } = req.body;

    if (!mantenimiento_id || !descripcion) {
      return res.status(400).json({ 
        success: false,
        error: "mantenimiento_id y descripcion son requeridos" 
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
      return res.status(404).json({ 
        success: false,
        error: "Mantenimiento no encontrado" 
      });
    }

    const result = await pool.query(
      `INSERT INTO observaciones_mantenimiento 
       (mantenimiento_id, descripcion, cargo_a, creado_por)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [mantenimiento_id, descripcion.trim(), cargo_a, req.user?.id || null]
    );

    res.json({
      success: true,
      refaccion: result.rows[0],
      message: "Observación/refacción agregada correctamente"
    });
  } catch (err) {
    console.error("Error agregando refacción:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al agregar refacción" 
    });
  }
});

// BLOQUE 4: Actualizar observación/refacción (MEJORADO)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, cargo_a, estado_resolucion } = req.body;

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

    let query = `UPDATE observaciones_mantenimiento 
                 SET descripcion = $1, cargo_a = $2, estado_resolucion = $3`;
    let params = [descripcion, cargo_a, estado_resolucion];

    // Si se marca como resuelto, agregar fecha y usuario
    if (estado_resolucion === 'resuelto') {
      query += `, fecha_resolucion = NOW(), resuelto_por = $4`;
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

// BLOQUE 5: Eliminar observación/refacción
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

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

// BLOQUE 6: Obtener estadísticas de refacciones
router.get("/estadisticas", async (req, res) => {
  try {
    // Total por estado
    const estados = await pool.query(
      `SELECT estado_resolucion, COUNT(*) as total
       FROM observaciones_mantenimiento 
       GROUP BY estado_resolucion`
    );

    // Total por cargo
    const cargos = await pool.query(
      `SELECT cargo_a, COUNT(*) as total
       FROM observaciones_mantenimiento 
       GROUP BY cargo_a`
    );

    // Total por mes
    const mensual = await pool.query(
      `SELECT 
         DATE_TRUNC('month', creado_en) as mes,
         COUNT(*) as total
       FROM observaciones_mantenimiento 
       GROUP BY DATE_TRUNC('month', creado_en)
       ORDER BY mes DESC
       LIMIT 12`
    );

    res.json({
      success: true,
      estadisticas: {
        por_estado: estados.rows,
        por_cargo: cargos.rows,
        mensual: mensual.rows
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