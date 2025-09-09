// routes/auth.js
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const pool = require("../db"); // exporta Pool desde backend/db.js
require("dotenv").config();


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

  const verifyUrl = `${process.env.FRONTEND_URL}/verify?token=${token}`;

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
      // 1) Revisar existencia
      console.log("🔍 Buscando si ya existe el usuario con email:", email);
      const exists = await pool.query('SELECT id FROM "Usuarios" WHERE email = $1', [email]);

      if (exists.rows.length) {
        console.log("⚠️ Ya existe usuario con ese correo:", email);
        return res.status(400).json({ error: "Este correo ya está registrado" });
      }

      // 2) Hash password
      console.log("🔐 Hasheando contraseña...");
      const saltRounds = 10;
      const hashed = await bcrypt.hash(password, saltRounds);

      // 3) Generar token de verificación
      console.log("🎟️ Generando token de verificación...");
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 3600 * 1000); // 24h

      // 4) Insertar usuario
      console.log("💾 Insertando usuario en DB...");
      const inserted = await pool.query(
        `INSERT INTO "Usuarios" (nombre, email, password, verification_token, verification_expires)
         VALUES ($1,$2,$3,$4,$5) RETURNING id, email`,
        [nombre, email, hashed, token, expires]
      );

      console.log("✅ Usuario insertado con id:", inserted.rows[0].id);

      // 5) Enviar email
      console.log("📧 Enviando correo de verificación a:", email);
      await sendVerificationEmail(email, token);

      return res.json({
        success: true,
        message: "Registro exitoso. Revisa tu correo para verificar tu cuenta."
      });
    } catch (err) {
      console.error("🔥 Error en /register:", err);
      return res.status(500).json({ error: err.message || "Ocurrió un error al registrar el usuario. Intenta nuevamente." });
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
// Login
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

      const payload = { id: user.id, email: user.email, rol: user.rol };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1h" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600 * 1000,
      });

      res.json({ message: "Login exitoso" });
    } catch (err) {
      console.error("🔥 Error en /login:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  }
);

module.exports = router;
