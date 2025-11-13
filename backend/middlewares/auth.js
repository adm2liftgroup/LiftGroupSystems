// backend/middlewares/auth.js
const jwt = require("jsonwebtoken");

function getToken(req) {
  // preferimos cookie httpOnly pero aceptamos header Authorization
  const fromCookie = req.cookies && req.cookies.token;
  const fromHeader = req.headers["authorization"];
  if (fromCookie) return fromCookie;
  if (fromHeader && fromHeader.startsWith("Bearer ")) {
    return fromHeader.replace("Bearer ", "");
  }
  return null;
}

function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "No autenticado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, rol, iat, exp }
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "No autenticado" });
  if (req.user.rol !== "admin") return res.status(403).json({ error: "No autorizado - se requieren permisos de administrador" });
  return next();
}

module.exports = { requireAuth, requireAdmin };
