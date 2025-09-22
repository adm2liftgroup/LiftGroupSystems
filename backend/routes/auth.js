// routes/auth.js
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const pool = require("../db");
require("dotenv").config();

// ================================
// Middleware: requireAuth (SOLO HEADER)
// ================================
const requireAuth = (req, res, next) => {
  try {
    console.log("🔍 Headers Authorization:", req.headers.authorization);
    
    let token = null;
    
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        token = authHeader;
      }
      console.log("✅ Token encontrado en Authorization header");
    }
    
    if (!token) {
      console.log("❌ No token found in Authorization header");
      return res.status(401).json({ error: "Acceso no autorizado. Token requerido." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log("✅ Token válido, usuario ID:", decoded.id);
    next();
  } catch (error) {
    console.error("❌ Error en autenticación:", error.message);
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
};

// ================================
// Helper: enviar email de verificación
// ================================
async function sendVerificationEmail(email, token) {
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const verifyUrl = `${process.env.BACKEND_URL}/auth/verify?token=${token}`;

  const info = await transporter.sendMail({
    from: `"LiftGroup" <adm2liftgroup@gmail.com>`,
    to: email,
    subject: "Verifica tu correo - LiftGroup",
    html: `<p>Hola, para verificar tu cuenta haz clic en el enlace:</p>
           <p><a href="${verifyUrl}">Verificar cuenta</a></p>`,
  });

  console.log("📨 Correo enviado, ID:", info.messageId);
}

// ================================
// Endpoint: datos del usuario autenticado
// ================================
router.get("/me", requireAuth, async (req, res) => {
  try {
    console.log("📥 GET /me recibido para usuario ID:", req.user.id);
    
    const q = await pool.query('SELECT id, nombre, email, rol FROM "Usuarios" WHERE id = $1', [req.user.id]);
    
    if (!q.rows.length) {
      console.log("❌ Usuario no encontrado en BD ID:", req.user.id);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    
    const user = q.rows[0];
    console.log("✅ Datos de usuario encontrados:", user);
    
    res.json({ 
      id: user.id, 
      nombre: user.nombre,
      email: user.email, 
      rol: user.rol 
    });
  } catch (err) {
    console.error("Error en /me:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// ================================
// Registro
// ================================
router.post(
  "/register",
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("nombre").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Errores de validación:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, email, password } = req.body;
    console.log("📥 POST /register recibido con body:", req.body);

    try {
      const exists = await pool.query('SELECT id FROM "Usuarios" WHERE email = $1', [email]);
      if (exists.rows.length) {
        return res.status(400).json({ error: "Este correo ya está registrado" });
      }

      const hashed = await bcrypt.hash(password, 10);
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 3600 * 1000);

      const inserted = await pool.query(
        `INSERT INTO "Usuarios" (nombre, email, password, verification_token, verification_expires)
         VALUES ($1,$2,$3,$4,$5) RETURNING id, email`,
        [nombre, email, hashed, token, expires]
      );

      await sendVerificationEmail(email, token);

      return res.json({
        success: true,
        message: "Registro exitoso. Revisa tu correo para verificar tu cuenta.",
      });
    } catch (err) {
      console.error("🔥 Error en /register:", err);
      return res.status(500).json({ error: "Error en el servidor al registrar usuario" });
    }
  }
);

// ================================
// Verificación de correo
// ================================
router.get("/verify", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send("Token requerido");

  try {
    const q = await pool.query(
      'SELECT id, verification_expires FROM "Usuarios" WHERE verification_token = $1',
      [token]
    );
    if (!q.rows.length) return res.status(400).send("Token inválido");

    const user = q.rows[0];
    if (user.verification_expires < new Date()) return res.status(400).send("Token expirado");

    await pool.query(
      'UPDATE "Usuarios" SET email_verified = true, verification_token = NULL, verification_expires = NULL WHERE id = $1',
      [user.id]
    );

    return res.redirect(`${process.env.FRONTEND_URL}/verify-success`);
  } catch (err) {
    console.error("🔥 Error en /verify:", err);
    res.status(500).send("Error del servidor");
  }
});

// ================================
// Login (ACTUALIZADO para devolver token)
// ================================
router.post(
  "/login",
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const q = await pool.query('SELECT * FROM "Usuarios" WHERE email = $1', [email]);
      if (!q.rows.length) return res.status(400).json({ error: "Credenciales inválidas" });

      const user = q.rows[0];
      if (!user.email_verified) return res.status(400).json({ error: "Email no verificado" });

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(400).json({ error: "Credenciales inválidas" });

      // ✅ CORRECCIÓN: Agregamos el rol al payload del token
      const payload = { 
        id: user.id, 
        email: user.email, 
        rol: user.rol, // ¡Este es el campo que faltaba!
        nombre: user.nombre
      };
      
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600 * 1000,
      });

      res.json({
        message: "Login exitoso",
        user: { 
          id: user.id, 
          nombre: user.nombre,
          email: user.email, 
          rol: user.rol 
        },
        token: token
      });
      
    } catch (err) {
      console.error("🔥 Error en /login:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  }
);


// ================================
// Endpoint: Obtener todos los usuarios (solo admin)
// ================================
router.get("/users", requireAuth, async (req, res) => {
  try {
    console.log("📥 GET /users recibido por usuario ID:", req.user.id, "Rol:", req.user.rol);
    
    // Verificar que el usuario sea admin (CORREGIDO: tenía 'admin|' en lugar de 'admin')
    if (req.user.rol !== 'admin') {
      console.log("❌ Acceso denegado. Usuario no es admin.");
      return res.status(403).json({ error: "Acceso denegado. Solo administradores." });
    }

    // Obtener todos los usuarios
    const q = await pool.query(
      'SELECT id, nombre, email, rol, email_verified, created_at FROM "Usuarios" ORDER BY created_at DESC'
    );

    console.log("✅ Usuarios obtenidos:", q.rows.length);
    console.log("📋 Usuarios:", q.rows);

    res.json({
      success: true,
      users: q.rows
    });
  } catch (err) {
    console.error("❌ Error en /users:", err);
    res.status(500).json({ error: "Error del servidor al obtener usuarios" });
  }
});

// ================================
// Confirmación de correo
// ================================
router.get("/confirm/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await pool.query(
      'UPDATE "Usuarios" SET confirmado = true WHERE id = $1',
      [decoded.id]
    );

    res.redirect(`${process.env.FRONTEND_URL}/confirmacion?status=ok`);
  } catch (error) {
    console.error("Error confirmando correo:", error.message);
    res.redirect(`${process.env.FRONTEND_URL}/confirmacion?status=error`);
  }
});

module.exports = router;
