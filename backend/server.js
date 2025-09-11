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

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL, // ej: http://localhost:3000
  credentials: true,                // permite enviar cookies
}));

// Rate limiting
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
  // lee cookie token o header Authorization
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
app.listen(process.env.PORT || 4000, () =>
  console.log(`Servidor en http://localhost:${process.env.PORT || 4000}`)
);
