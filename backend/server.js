// backend/server.js
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

// Inicialización
const app = express();

// Seguridad
app.use(helmet());

// Body parser + cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ← AÑADIR ESTO
app.use(cookieParser());

// CORS permite PC y celular
const allowedOrigins = [
  "http://localhost:3000",          // frontend para la PC
  "http://192.168.0.193:3000"       // frontend en el celular para la red local
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true, // permite cookies
}));

// SERVIR ARCHIVOS ESTÁTICOS - AÑADIR ESTO ↓
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 100 
});
app.use(limiter);

// Rutas
const authRoutes = require("./routes/auth");
const montacargasRoutes = require("./routes/montacargas");
const mantenimientosRoutes = require("./routes/mantenimientos");
const refaccionesRoutes = require('./routes/refacciones');


app.use("/auth", authRoutes);
app.use("/api/montacargas", montacargasRoutes);
app.use("/api/mantenimientos", mantenimientosRoutes);
app.use('/api/refacciones', refaccionesRoutes);
// Arrancar servidor
app.listen(process.env.PORT || 4000, "0.0.0.0", () =>
  console.log(`Servidor en http://0.0.0.0:${process.env.PORT || 4000}`)
);