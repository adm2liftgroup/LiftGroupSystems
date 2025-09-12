// backend/server.js
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ======================
// Inicialización
// ======================
const app = express();

// Seguridad
app.use(helmet());

// Body parser + cookies
app.use(express.json());
app.use(cookieParser());

// ======================
// CORS (permite PC y celular)
// ======================
const allowedOrigins = [
  "http://localhost:3000",          // frontend en tu PC
  "http://192.168.0.193:3000"       // frontend en tu celular en red local
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

// ======================
// Rate limiting
// ======================
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 100 
});
app.use(limiter);

// ======================
// Rutas
// ======================
const authRoutes = require("./routes/auth");
const montacargasRoutes = require("./routes/montacargas");

app.use("/auth", authRoutes);
app.use("/api/montacargas", montacargasRoutes);

// ======================
// Ejemplo de ruta protegida
// ======================
function authMiddleware(req, res, next) {
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, rol }
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

app.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "Acceso permitido", user: req.user });
});

// ======================
// Arrancar servidor
// ======================
app.listen(process.env.PORT || 4000, "0.0.0.0", () =>
  console.log(`Servidor en http://0.0.0.0:${process.env.PORT || 4000}`)
);
