
// backend/routes/montacargas.js
const express = require("express");
const router = express.Router();
const pool = require("../db"); // Pool de pg

// Obtener todos los montacargas
router.get("/", async (req, res) => {
  try {
    // usar comillas para respetar el nombre con mayúscula "Montacargas" y la columna "Número"
    const result = await pool.query(
      'SELECT "Número","Marca","Modelo","Serie","Sistema","Capacidad" FROM "Montacargas" ORDER BY "Número" ASC'
    );
    res.json(result.rows); // devuelve array de objetos
  } catch (err) {
    console.error("GET /api/montacargas error:", err);
    res.status(500).json({ error: "Error al obtener Montacargas" });
  }
});

// Crear montacargas
router.post("/", async (req, res) => {
  try {
    // usar bracket access por seguridad si tu frontend envía propiedades con tilde
    const Numero = req.body["Número"];
    const Marca = req.body["Marca"];
    const Modelo = req.body["Modelo"];
    const Serie = req.body["Serie"];
    const Sistema = req.body["Sistema"];
    const Capacidad = req.body["Capacidad"];

    const result = await pool.query(
      'INSERT INTO "Montacargas" ("Número","Marca","Modelo","Serie","Sistema","Capacidad") VALUES ($1,$2,$3,$4,$5,$6) RETURNING "Número","Marca","Modelo","Serie","Sistema","Capacidad"',
      [Numero, Marca, Modelo, Serie, Sistema, Capacidad]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/montacargas error:", err);
    res.status(500).json({ error: "Error al crear Montacargas" });
  }
});

// Actualizar montacargas (no cambia la PK "Número")
router.put("/:numero", async (req, res) => {
  try {
    const numeroParam = req.params.numero; // viene en la URL
    const Marca = req.body["Marca"];
    const Modelo = req.body["Modelo"];
    const Serie = req.body["Serie"];
    const Sistema = req.body["Sistema"];
    const Capacidad = req.body["Capacidad"];

    const result = await pool.query(
      'UPDATE "Montacargas" SET "Marca"=$1, "Modelo"=$2, "Serie"=$3, "Sistema"=$4, "Capacidad"=$5 WHERE "Número"=$6 RETURNING "Número","Marca","Modelo","Serie","Sistema","Capacidad"',
      [Marca, Modelo, Serie, Sistema, Capacidad, numeroParam]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Montacargas no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /api/montacargas/:numero error:", err);
    res.status(500).json({ error: "Error al actualizar Montacargas" });
  }
});

// Eliminar montacargas
router.delete("/:numero", async (req, res) => {
  try {
    const numeroParam = req.params.numero;

    const result = await pool.query(
      'DELETE FROM "Montacargas" WHERE "Número"=$1 RETURNING "Número"',
      [numeroParam]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Montacargas no encontrado" });
    }

    res.json({ message: "Montacargas eliminado correctamente", "Número": result.rows[0]["Número"] });
  } catch (err) {
    console.error("DELETE /api/montacargas/:numero error:", err);
    res.status(500).json({ error: "Error al eliminar Montacargas" });
  }
});

module.exports = router;
