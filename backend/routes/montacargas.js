const express = require("express");
const router = express.Router();
const pool = require("../db");

// BLOQUE 1: Obtener todos los montacargas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT numero, "Marca", "Modelo", "Serie", "Sistema", "Capacidad" FROM "Montacargas" ORDER BY numero ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/montacargas error:", err);
    res.status(500).json({ error: "Error al obtener Montacargas" });
  }
});
// FIN DEL BLOQUE 1: Obtener todos los montacargas

// BLOQUE 2: Obtener un montacargas específico por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT numero, "Marca", "Modelo", "Serie", "Sistema", "Capacidad" FROM "Montacargas" WHERE numero = $1',
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
// FIN DEL BLOQUE 2: Obtener un montacargas específico por ID

// BLOQUE 3: Crear montacargas
router.post("/", async (req, res) => {
  try {
    const { numero, Marca, Modelo, Serie, Sistema, Capacidad } = req.body;

    const result = await pool.query(
      'INSERT INTO "Montacargas" (numero, "Marca", "Modelo", "Serie", "Sistema", "Capacidad") VALUES ($1, $2, $3, $4, $5, $6) RETURNING numero, "Marca", "Modelo", "Serie", "Sistema", "Capacidad"',
      [numero, Marca, Modelo, Serie, Sistema, Capacidad]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/montacargas error:", err);
    res.status(500).json({ error: "Error al crear Montacargas" });
  }
});
// FIN DEL BLOQUE 3: Crear montacargas

// BLOQUE 4: Actualizar montacargas
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { Marca, Modelo, Serie, Sistema, Capacidad } = req.body;

    const result = await pool.query(
      'UPDATE "Montacargas" SET "Marca"=$1, "Modelo"=$2, "Serie"=$3, "Sistema"=$4, "Capacidad"=$5 WHERE numero=$6 RETURNING numero, "Marca", "Modelo", "Serie", "Sistema", "Capacidad"',
      [Marca, Modelo, Serie, Sistema, Capacidad, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Montacargas no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /api/montacargas/:id error:", err);
    res.status(500).json({ error: "Error al actualizar Montacargas" });
  }
});
// FIN DEL BLOQUE 4: Actualizar montacargas

// BLOQUE 5: Eliminar montacargas
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM "Montacargas" WHERE numero=$1 RETURNING numero',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Montacargas no encontrado" });
    }

    res.json({ message: "Montacargas eliminado correctamente", numero: result.rows[0].numero });
  } catch (err) {
    console.error("DELETE /api/montacargas/:id error:", err);
    res.status(500).json({ error: "Error al eliminar Montacargas" });
  }
});
// FIN DEL BLOQUE 5: Eliminar montacargas

module.exports = router;