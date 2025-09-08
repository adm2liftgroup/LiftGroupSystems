const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Probar conexión con una consulta
pool.query("SELECT NOW()")
  .then(res => console.log("Conectado a PostgreSQL en:", res.rows[0].now))
  .catch(err => console.error(" Error de conexión a PostgreSQL:", err.message));

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Servidor funcionando ");
});

/* Ruta para obtener montacargas
app.get("/montacargas", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Montacargas"');
    res.json(result.rows);
  } catch (err) {
    console.error("Error en /montacargas:", err.message);
    res.status(500).send("Error al obtener montacargas");
  }
}); */

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
