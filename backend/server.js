const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Auth routes
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

// Example protected route
const jwt = require("jsonwebtoken");
function authMiddleware(req, res, next) {
  // lee cookie token o header Authorization
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
  if (!token) return res.status(401).json({ error: "No autorizado" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}
app.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "Acceso permitido", user: req.user });
});

app.listen(4000, () => console.log("Server en puerto 4000"));
