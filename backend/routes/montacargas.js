// routes/montacargas.js
const express = require("express");
const router = express.Router();
const pool = require("../db"); // tu conexión a PostgreSQL

// Obtener todos los montacargas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Montacargas" ORDER BY "Número"');
    res.json(result.rows);
  } catch (err) {
    console.error("Error GET montacargas:", err);
    res.status(500).json({ error: "Error al obtener montacargas" });
  }
});

// Crear montacargas
router.post("/", async (req, res) => {
  try {
    const { numero, marca, modelo, serie, sistema, capacidad } = req.body;

    const result = await pool.query(
      'INSERT INTO "Montacargas" ("Número", "Marca", "Modelo", "Serie", "Sistema", "Capacidad") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [numero, marca, modelo, serie, sistema, capacidad]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error POST montacargas:", err);
    res.status(500).json({ error: "Error al registrar montacargas" });
  }
});

module.exports = router;
