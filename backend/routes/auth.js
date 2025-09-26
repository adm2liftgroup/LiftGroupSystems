const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const pool = require("../db"); // conexión a PostgreSQL
require("dotenv").config();

// BLOQUE 1: Middleware requireAuth
// Este middleware protege rutas privadas, verifica el tokeb  JWT en el header "Authorization", si es válido, agrega los datos del usuario a req.user, si no, devuelve 401 (no autorizado)
const requireAuth = (req, res, next) => {
  try {
    console.log("🔍 Headers Authorization:", req.headers.authorization);
    
    let token = null;
    
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization; // Soporta formato "Barer token" o solo "token"
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        token = authHeader;
      }
      console.log("Token encontrado en Authorization header");
    }
    
    if (!token) {
      console.log("No token found in Authorization header");
      return res.status(401).json({ error: "Acceso no autorizado. Token requerido." });
    }

    //Verifica el token y lo decodifica 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // se guarda la info del usuario para usarla en la ruta
    console.log(" Token válido, usuario ID:", decoded.id);
    next();
  } catch (error) {
    console.error(" Error en autenticación:", error.message);
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
};
// FIN DEL BLOQUE 1: Middleware requireAuth 

//  BLOQUE 2: Helper para enviar email de verificación
// Usando en el registro para mandar un correo con el link de verificación al usuario
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

  console.log("Correo enviado, ID:", info.messageId);
}
// FIN DEL BLOQUE 2: Helper para enviar email de verificación

// BLOQUE 3: Endpoint GET /me 
// Devuelve los datos del usuario autenticado (usando requireAuth para validar el token)
router.get("/me", requireAuth, async (req, res) => {
  try {
    console.log("GET /me recibido para usuario ID:", req.user.id);
    
    const q = await pool.query('SELECT id, nombre, email, rol FROM "Usuarios" WHERE id = $1', [req.user.id]);
    
    if (!q.rows.length) {
      console.log("❌ Usuario no encontrado en BD ID:", req.user.id);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    
    const user = q.rows[0];
    console.log("Datos de usuario encontrados:", user);
    
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
// FIN DEL BLOQUE 3: Endpoint GET /me

// BLOQUE 4: Registro (POST /register)
// Valida datos del formulario, verifica si el correo ya está registrado, hashea la contraseña con bcrypt, genera un token de verificación temporal, 
// inserta en la BD y envía correo de verificación 
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
    console.log("POST /register recibido con body:", req.body);

    try { // Verifica si el email ya existe 
      const exists = await pool.query('SELECT id FROM "Usuarios" WHERE email = $1', [email]);
      if (exists.rows.length) {
        return res.status(400).json({ error: "Este correo ya está registrado" });
      }

      // Encriptar contraseña
      const hashed = await bcrypt.hash(password, 10);
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 3600 * 1000);

      // Insertar usuario nuevo
      const inserted = await pool.query(
        `INSERT INTO "Usuarios" (nombre, email, password, verification_token, verification_expires)
         VALUES ($1,$2,$3,$4,$5) RETURNING id, email`,
        [nombre, email, hashed, token, expires]
      );

      // Enciar correo de verificación
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
// FIN DEL BLOQUE 4: Registro (POST /register)

// BLOQUE 5: Verificación de correo (GET /verify)
// El usuario entra al link enviado por email, si el token existe y no ha expirado activa email_verified, redirige al frontend en una página de éxito
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
    console.error(" Error en /verify:", err);
    res.status(500).send("Error del servidor");
  }
});
// FIN DEL BLOQUE 5: Verificación de correo (GET /verify)

// BLOQUE 6: Login (POST /login)
// Verifica email y contraseña, confirma que el email esté verificado, devuelve un token JWT con id, email, nombre y rol, guarda también el token en cookie httpOnly
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

      // Crear token con datos del usuario
      const payload = { 
        id: user.id, 
        email: user.email, 
        rol: user.rol, 
        nombre: user.nombre
      };
      
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      });

      // Guardar token en cookie segura 
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
      console.error("Error en /login:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  }
);
// FIN DEL BLOQUE 6: Login (POST /login)

// BLOQUE 7: Obtener todos los usuarios (GET /users)
// Solo accesible para usuarios con rol "admin", devuelve lista de todos los usuarios registrados
router.get("/users", requireAuth, async (req, res) => {
  try {
    console.log("GET /users recibido por usuario ID:", req.user.id, "Rol:", req.user.rol);
    
    // Verificar que el usuario sea admin (CORREGIDO: tenía 'admin|' en lugar de 'admin')
    if (req.user.rol !== 'admin') {
      console.log("Acceso denegado. Usuario no es admin.");
      return res.status(403).json({ error: "Acceso denegado. Solo administradores." });
    }

    // Obtener todos los usuarios
    const q = await pool.query(
      'SELECT id, nombre, email, rol, email_verified, created_at FROM "Usuarios" ORDER BY created_at DESC'
    );

    console.log("Usuarios obtenidos:", q.rows.length);
    console.log("Usuarios:", q.rows);

    res.json({
      success: true,
      users: q.rows
    });
  } catch (err) {
    console.error("Error en /users:", err);
    res.status(500).json({ error: "Error del servidor al obtener usuarios" });
  }
});
//FIN DEL BLOQUE 7: Obtener todos los usuarios (GET /users)

// BLOQUE 8: Confirmación de correo
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
// FIN DEL BLOQUE 8: Confirmación de correo

// BLOQUE 9: Obtener mantenimientos del mes actual (GET /mantenimientos-mes-actual) - ACTUALIZADO
router.get("/mantenimientos-mes-actual", requireAuth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: "Acceso denegado. Solo administradores." });
    }

    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();

    const q = await pool.query(
      `SELECT 
        mp.id,
        mp.mes,
        mp.anio,
        mp.tipo,
        mp.fecha,
        mp.tecnico_id,
        mp.creado_en,
        m.numero as montacargas_numero,
        m."Marca" as montacargas_marca,
        m."Modelo" as montacargas_modelo,
        m."Serie" as montacargas_serie,
        m."Ubicacion" as montacargas_ubicacion,
        m."Planta" as montacargas_planta,
        u.nombre as tecnico_nombre
       FROM mantenimientos_programados mp
       JOIN "Montacargas" m ON mp.montacargas_id = m.numero
       LEFT JOIN "Usuarios" u ON mp.tecnico_id = u.id
       WHERE mp.mes = $1 AND mp.anio = $2
       ORDER BY mp.fecha, m.numero`,
      [mesActual, anioActual]
    );

    res.json({
      success: true,
      mes: mesActual,
      anio: anioActual,
      total: q.rows.length,
      mantenimientos: q.rows
    });
  } catch (err) {
    console.error("Error en /mantenimientos-mes-actual:", err);
    res.status(500).json({ error: "Error del servidor al obtener mantenimientos del mes" });
  }
});
// FIN DEL BLOQUE 9: Obtener mantenimientos del mes actual

// BLOQUE 10: Obtener lista de técnicos (GET /tecnicos) - USANDO TABLA USUARIOS
router.get("/tecnicos", requireAuth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: "Acceso denegado. Solo administradores." });
    }

    // Obtenemos todos los usuarios con rol 'user' como técnicos
    const q = await pool.query(
      'SELECT id, nombre, email, rol, email_verified, created_at FROM "Usuarios" WHERE rol = $1 AND email_verified = true ORDER BY nombre',
      ['user']  // Los técnicos son usuarios con rol 'user'
    );

    res.json({
      success: true,
      tecnicos: q.rows
    });
  } catch (err) {
    console.error("Error en /tecnicos:", err);
    res.status(500).json({ error: "Error del servidor al obtener técnicos" });
  }
});

// BLOQUE 11: Asignar técnico a mantenimiento (PUT /asignar-tecnico)
router.put("/asignar-tecnico", requireAuth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: "Acceso denegado. Solo administradores." });
    }

    const { mantenimientoId, tecnicoId } = req.body;
    console.log("📋 Asignando técnico:", { mantenimientoId, tecnicoId });

    if (!mantenimientoId || !tecnicoId) {
      return res.status(400).json({ error: "ID de mantenimiento y técnico son requeridos" });
    }

    // Verificar que el mantenimiento existe
    const mantenimientoCheck = await pool.query(
      `SELECT mp.*, m."Marca", m."Modelo", m.numero 
       FROM mantenimientos_programados mp 
       JOIN "Montacargas" m ON mp.montacargas_id = m.numero 
       WHERE mp.id = $1`,
      [mantenimientoId]
    );

    if (mantenimientoCheck.rows.length === 0) {
      return res.status(404).json({ error: "Mantenimiento no encontrado" });
    }

    // Verificar que el técnico (usuario) existe y está verificado
    const tecnicoCheck = await pool.query(
      'SELECT id, nombre, email FROM "Usuarios" WHERE id = $1 AND rol = $2 AND email_verified = true',
      [tecnicoId, 'user']
    );

    if (tecnicoCheck.rows.length === 0) {
      return res.status(404).json({ error: "Técnico no encontrado o no verificado" });
    }

    const mantenimiento = mantenimientoCheck.rows[0];
    const tecnico = tecnicoCheck.rows[0];
    
    console.log("🔧 Mantenimiento encontrado:", mantenimiento.numero);
    console.log("👤 Técnico encontrado:", tecnico.nombre, tecnico.email);

    // Actualizar el mantenimiento con el técnico asignado
    const updateResult = await pool.query(
      'UPDATE mantenimientos_programados SET tecnico_id = $1 WHERE id = $2 RETURNING *',
      [tecnicoId, mantenimientoId]
    );

    console.log("✅ Mantenimiento actualizado en BD");

    // Enviar correo de notificación al técnico
    const emailEnviado = await enviarNotificacionTecnico(tecnico, mantenimiento);
    
    if (emailEnviado) {
      console.log("✅ Notificación por correo enviada exitosamente");
      res.json({
        success: true,
        message: "Técnico asignado correctamente y notificación enviada",
        mantenimiento: updateResult.rows[0]
      });
    } else {
      console.log("⚠️ Técnico asignado pero falló el envío de correo");
      res.json({
        success: true,
        message: "Técnico asignado correctamente, pero hubo un problema al enviar la notificación por correo",
        mantenimiento: updateResult.rows[0]
      });
    }

  } catch (err) {
    console.error("❌ Error en /asignar-tecnico:", err);
    res.status(500).json({ error: "Error del servidor al asignar técnico" });
  }
});

// BLOQUE 12: Función para enviar notificación al técnico
async function enviarNotificacionTecnico(tecnico, mantenimiento) {
  try {
    console.log("📧 Intentando enviar correo de notificación a:", tecnico.email);
    
    // USAR EXACTAMENTE LA MISMA CONFIGURACIÓN que sendVerificationEmail
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { 
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS 
      },
    });

    const fechaFormateada = new Date(mantenimiento.fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Usar el MISMO formato de "from" que en sendVerificationEmail
    const mailOptions = {
      from: `"LiftGroup" <adm2liftgroup@gmail.com>`, // ← IGUAL que en verificación
      to: tecnico.email,
      subject: `Nueva asignación de mantenimiento - Montacargas #${mantenimiento.numero}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Nueva Asignación de Mantenimiento</h2>
          <p>Hola <strong>${tecnico.nombre}</strong>,</p>
          
          <p>Se te ha asignado un nuevo mantenimiento:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3>Detalles del Mantenimiento</h3>
            <p><strong>Montacargas:</strong> #${mantenimiento.numero}</p>
            <p><strong>Marca/Modelo:</strong> ${mantenimiento.Marca} ${mantenimiento.Modelo}</p>
            <p><strong>Tipo:</strong> ${mantenimiento.tipo}</p>
            <p><strong>Fecha:</strong> ${fechaFormateada}</p>
          </div>
          
          <p>Por favor, inicia sesión en el sistema para confirmar.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Correo de notificación enviado al técnico:", tecnico.email);
    console.log("📨 ID del mensaje:", info.messageId);
    return true;
    
  } catch (error) {
    console.error("❌ Error enviando correo al técnico:", error);
    
    // Log detallado del error
    if (error.response) {
      console.error("Código de error SMTP:", error.responseCode);
      console.error("Respuesta SMTP:", error.response);
    }
    
    return false;
  }
}
// BLOQUE 13: Obtener mantenimientos asignados a un técnico (GET /mis-mantenimientos)
router.get("/mis-mantenimientos", requireAuth, async (req, res) => {
  try {
    // Verificar que el usuario es un técnico (rol 'user')
    if (req.user.rol !== 'user') {
      return res.status(403).json({ error: "No tienes asignaciones de mantenimiento" });
    }

    const tecnicoId = req.user.id;
    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();

    const q = await pool.query(
      `SELECT 
        mp.id,
        mp.mes,
        mp.anio,
        mp.tipo,
        mp.fecha,
        mp.creado_en,
        m.numero as montacargas_numero,
        m."Marca" as montacargas_marca,
        m."Modelo" as montacargas_modelo,
        m."Serie" as montacargas_serie,
        m."Ubicacion" as montacargas_ubicacion,
        m."Planta" as montacargas_planta,
        u.nombre as tecnico_nombre
       FROM mantenimientos_programados mp
       JOIN "Montacargas" m ON mp.montacargas_id = m.numero
       JOIN "Usuarios" u ON mp.tecnico_id = u.id
       WHERE mp.tecnico_id = $1 AND mp.mes = $2 AND mp.anio = $3
       ORDER BY mp.fecha`,
      [tecnicoId, mesActual, anioActual]
    );

    res.json({
      success: true,
      tecnico: { id: tecnicoId, nombre: req.user.nombre },
      total: q.rows.length,
      mantenimientos: q.rows
    });

  } catch (err) {
    console.error("Error en /mis-mantenimientos:", err);
    res.status(500).json({ error: "Error del servidor al obtener mantenimientos asignados" });
  }
});

module.exports = router;