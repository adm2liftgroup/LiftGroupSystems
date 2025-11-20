const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require('multer');
const { uploadImageToS3, deleteFromS3 } = require('../aws-s3');
const nodemailer = require('nodemailer');

// Configurar el transporter para Brevo (Sendinblue)
// Configurar el transporter para Brevo (Sendinblue) - MISMA CONFIGURACIÓN QUE EN MANTENIMIENTOS
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// FUNCIÓN: Enviar notificación de asignación de observación - VERSIÓN MEJORADA
const enviarNotificacionObservacion = async (tecnicoEmail, tecnicoNombre, observacionData, mantenimientoData) => {
  try {
    console.log('📧 [OBSERVACIONES] Enviando notificación a:', tecnicoEmail);
    
    // Validaciones críticas
    if (!tecnicoEmail || !tecnicoEmail.includes('@')) {
      console.log('❌ [OBSERVACIONES] Email inválido:', tecnicoEmail);
      return false;
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('❌ [OBSERVACIONES] Credenciales de Brevo no configuradas');
      return false;
    }

    const fechaProgramada = new Date(mantenimientoData.fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'notificaciones@liftgroup.com',
      to: tecnicoEmail,
      subject: `📋 Nueva Observación Asignada - Montacargas #${mantenimientoData.montacargas_numero}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .card { background: white; border-radius: 8px; padding: 20px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .badge { display: inline-block; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
                .badge-pendiente { background: #fff3cd; color: #856404; }
                .badge-empresa { background: #d1ecf1; color: #0c5460; }
                .badge-cliente { background: #f8d7da; color: #721c24; }
                .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; }
                .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔧 Nueva Observación Asignada</h1>
                    <p>Sistema de Gestión de Mantenimiento - LiftGroup</p>
                </div>
                
                <div class="content">
                    <p>Hola <strong>${tecnicoNombre}</strong>,</p>
                    <p>Has sido asignado a una nueva observación de mantenimiento en el sistema.</p>
                    
                    <div class="card">
                        <h3>📋 Detalles de la Observación</h3>
                        <p><strong>Descripción:</strong> ${observacionData.descripcion}</p>
                        <p><strong>Estado:</strong> <span class="badge badge-pendiente">Pendiente</span></p>
                        <p><strong>Cargo:</strong> <span class="badge ${observacionData.cargo_a === 'empresa' ? 'badge-empresa' : 'badge-cliente'}">${observacionData.cargo_a === 'empresa' ? 'Cargo a Empresa' : 'Cargo a Cliente'}</span></p>
                        <p><strong>Fecha de Creación:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                    </div>
                    
                    <div class="card">
                        <h3>🚗 Información del Montacargas</h3>
                        <p><strong>Número:</strong> #${mantenimientoData.montacargas_numero}</p>
                        <p><strong>Marca/Modelo:</strong> ${mantenimientoData.montacargas_marca} ${mantenimientoData.montacargas_modelo}</p>
                        <p><strong>Serie:</strong> ${mantenimientoData.montacargas_serie}</p>
                        <p><strong>Ubicación:</strong> ${mantenimientoData.montacargas_ubicacion || 'No especificada'}</p>
                        <p><strong>Mantenimiento:</strong> ${mantenimientoData.tipo} - ${fechaProgramada}</p>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL || 'https://tu-app.com'}" class="btn">
                            📲 Acceder al Sistema
                        </a>
                    </div>
                    
                    <p><strong>Acciones Requeridas:</strong></p>
                    <ul>
                        <li>Revisar la observación asignada</li>
                        <li>Completar la tarea con firma digital</li>
                        <li>Agregar imágenes como evidencia si es necesario</li>
                        <li>Marcar como completado cuando finalice</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p>Este es un mensaje automático del Sistema de Gestión de Mantenimiento LiftGroup.</p>
                    <p>Por favor no responda a este correo.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    console.log('📤 [OBSERVACIONES] Configurando envío de correo...');
    
    // Verificar conexión con el transporter
    await transporter.verify();
    console.log('✅ [OBSERVACIONES] Conexión con servidor de correo verificada');

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ [OBSERVACIONES] Notificación enviada:', info.messageId);
    console.log('✅ [OBSERVACIONES] Correo aceptado por:', info.accepted);
    
    return true;
  } catch (error) {
    console.error('❌ [OBSERVACIONES] Error enviando notificación:', error);
    console.error('❌ [OBSERVACIONES] Detalles del error:', {
      message: error.message,
      code: error.code
    });
    return false;
  }
};

// Configurar multer para MÚLTIPLES imágenes Y firma
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite para imágenes
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)'));
    }
  }
});

// BLOQUE 1: Obtener todas las observaciones/refacciones - ACTUALIZADO CON TÉCNICO ASIGNADO
router.get("/", async (req, res) => {
  try {
    const q = await pool.query(
      `SELECT 
        om.*,
        mp.tipo as mantenimiento_tipo,
        mp.fecha as mantenimiento_fecha,
        m.numero as montacargas_numero,
        m."Marca" as montacargas_marca,
        m."Modelo" as montacargas_modelo,
        m."Serie" as montacargas_serie,
        u1.nombre as tecnico_nombre,
        u2.nombre as resuelto_por_nombre,
        u3.nombre as tecnico_asignado_nombre  -- NUEVO: técnico asignado
       FROM observaciones_mantenimiento om
       JOIN mantenimientos_programados mp ON om.mantenimiento_id = mp.id
       JOIN "Montacargas" m ON mp.montacargas_id = m.numero
       LEFT JOIN "Usuarios" u1 ON om.creado_por = u1.id
       LEFT JOIN "Usuarios" u2 ON om.resuelto_por = u2.id
       LEFT JOIN "Usuarios" u3 ON om.tecnico_asignado_id = u3.id  -- NUEVO JOIN
       ORDER BY om.creado_en DESC`
    );

    res.json({
      success: true,
      refacciones: q.rows
    });
  } catch (err) {
    console.error("Error obteniendo refacciones:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al obtener refacciones" 
    });
  }
});

// BLOQUE 2: Obtener observaciones de un mantenimiento específico - ACTUALIZADO CON DEBUG
router.get("/mantenimiento/:mantenimientoId", async (req, res) => {
  try {
    const { mantenimientoId } = req.params;
    
    console.log('🔍 Obteniendo observaciones para mantenimiento:', mantenimientoId);
    console.log('👤 Usuario haciendo la petición:', req.user);
    console.log('🔑 Headers de autorización:', req.headers.authorization);
    
    // Debug temporal: simular un usuario técnico si no hay autenticación
    let usuarioId = req.user?.id;
    if (!usuarioId) {
      console.log('⚠️ No hay usuario autenticado, usando debug...');
      // Para debug, puedes simular un usuario técnico específico
      // usuarioId = 10; // ID del técnico "Prueba 3"
    }

    const q = await pool.query(
      `SELECT 
        om.*,
        u1.nombre as tecnico_nombre,
        u2.nombre as resuelto_por_nombre,
        u3.nombre as tecnico_asignado_nombre
       FROM observaciones_mantenimiento om
       LEFT JOIN "Usuarios" u1 ON om.creado_por = u1.id
       LEFT JOIN "Usuarios" u2 ON om.resuelto_por = u2.id
       LEFT JOIN "Usuarios" u3 ON om.tecnico_asignado_id = u3.id
       WHERE om.mantenimiento_id = $1
       ORDER BY om.creado_en DESC`,
      [mantenimientoId]
    );

    console.log(`✅ Encontradas ${q.rows.length} observaciones para mantenimiento ${mantenimientoId}`);
    
    // Log para debug: mostrar información de cada observación
    q.rows.forEach((obs, index) => {
      console.log(`📋 Observación ${index + 1}:`, {
        id: obs.id,
        tecnico_asignado_id: obs.tecnico_asignado_id,
        tipo_tecnico_asignado_id: typeof obs.tecnico_asignado_id,
        tecnico_asignado_nombre: obs.tecnico_asignado_nombre,
        estado: obs.estado_resolucion,
        descripcion: obs.descripcion?.substring(0, 30) + '...'
      });
    });

    res.json({
      success: true,
      observaciones: q.rows
    });
  } catch (err) {
    console.error("Error obteniendo observaciones:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al obtener observaciones" 
    });
  }
});

// BLOQUE 3: Agregar nueva observación con hasta 3 imágenes - ACTUALIZADO CON NOTIFICACIÓN POR CORREO
router.post("/", upload.array('imagenes', 3), async (req, res) => {
  try {
    console.log('📥 POST /api/refacciones recibido');
    console.log('📋 Body fields:', req.body);
    console.log('📁 Files:', req.files ? `${req.files.length} archivos` : 'Ninguno');

    const { 
      mantenimiento_id, 
      descripcion,
      cargo_a = 'empresa',
      estado_resolucion = 'pendiente',
      es_evidencia = 'false',
      tecnico_asignado_id = null,
      // Nuevos campos para firma
      firma_data = null,
      firma_nombre = null
    } = req.body;

    // Validaciones
    if (!mantenimiento_id) {
      console.log('❌ mantenimiento_id faltante');
      return res.status(400).json({ 
        success: false,
        error: "mantenimiento_id es requerido" 
      });
    }

    if (!descripcion) {
      console.log('❌ descripcion faltante');
      return res.status(400).json({ 
        success: false,
        error: "descripcion es requerido" 
      });
    }

    // Verificar que el mantenimiento existe
    const mantenimientoCheck = await pool.query(
      `SELECT mp.*, m.numero as montacargas_numero, 
              m."Marca" as montacargas_marca, m."Modelo" as montacargas_modelo,
              m."Serie" as montacargas_serie, m."Ubicacion" as montacargas_ubicacion
       FROM mantenimientos_programados mp
       JOIN "Montacargas" m ON mp.montacargas_id = m.numero
       WHERE mp.id = $1`,
      [mantenimiento_id]
    );

    if (mantenimientoCheck.rows.length === 0) {
      console.log('❌ Mantenimiento no encontrado:', mantenimiento_id);
      return res.status(404).json({ 
        success: false,
        error: "Mantenimiento no encontrado" 
      });
    }

    const mantenimientoInfo = mantenimientoCheck.rows[0];

    // NUEVO: Validar que el técnico asignado existe si se proporciona y obtener info para correo
    let tecnicoAsignadoId = null;
    let tecnicoInfo = null;

    if (tecnico_asignado_id && tecnico_asignado_id !== '') {
      // Convertir a número entero
      tecnicoAsignadoId = parseInt(tecnico_asignado_id);
      
      console.log('🆔 tecnico_asignado_id recibido:', tecnico_asignado_id, 'Tipo:', typeof tecnico_asignado_id);
      console.log('🆔 tecnico_asignado_id convertido:', tecnicoAsignadoId, 'Tipo:', typeof tecnicoAsignadoId);

      const tecnicoCheck = await pool.query(
        'SELECT id, nombre, email FROM "Usuarios" WHERE id = $1',
        [tecnicoAsignadoId]
      );
      
      if (tecnicoCheck.rows.length === 0) {
        console.log('❌ Técnico asignado no encontrado:', tecnicoAsignadoId);
        return res.status(400).json({ 
          success: false,
          error: "El técnico asignado no existe" 
        });
      }
      
      tecnicoInfo = tecnicoCheck.rows[0];
      console.log('✅ Técnico asignado válido:', tecnicoInfo.nombre, 'Email:', tecnicoInfo.email);
    }

    // Inicializar campos de imágenes
    let imagen_url_1 = null, imagen_nombre_1 = null;
    let imagen_url_2 = null, imagen_nombre_2 = null;
    let imagen_url_3 = null, imagen_nombre_3 = null;
    let firma_url = null;

    // Subir hasta 3 imágenes
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < Math.min(req.files.length, 3); i++) {
        const file = req.files[i];
        try {
          console.log(`📤 Subiendo imagen ${i+1}/${req.files.length} a AWS S3...`);
          const imagen_url = await uploadImageToS3(
            file.buffer,
            file.originalname,
            file.mimetype
          );

          // Asignar a los campos correspondientes
          if (i === 0) {
            imagen_url_1 = imagen_url;
            imagen_nombre_1 = file.originalname;
          } else if (i === 1) {
            imagen_url_2 = imagen_url;
            imagen_nombre_2 = file.originalname;
          } else if (i === 2) {
            imagen_url_3 = imagen_url;
            imagen_nombre_3 = file.originalname;
          }

          console.log('✅ Imagen subida a S3:', imagen_url);
        } catch (imageError) {
          console.error('❌ Error subiendo imagen a S3:', imageError);
        }
      }
    }

    // Procesar firma digital si está presente
    if (firma_data && firma_nombre) {
      try {
        console.log('✍️ Procesando firma digital...');
        
        // Convertir base64 a buffer
        const base64Data = firma_data.replace(/^data:image\/\w+;base64,/, '');
        const firmaBuffer = Buffer.from(base64Data, 'base64');
        
        // Subir firma a S3
        firma_url = await uploadImageToS3(
          firmaBuffer,
          `firma-${Date.now()}.png`,
          'image/png'
        );
        
        console.log('✅ Firma subida a S3:', firma_url);
      } catch (firmaError) {
        console.error('❌ Error subiendo firma a S3:', firmaError);
      }
    }

    console.log('💾 Guardando en base de datos...');
    
    // Convertir es_evidencia a boolean
    const esEvidenciaBool = es_evidencia === 'true' || es_evidencia === true;
    
    const result = await pool.query(
      `INSERT INTO observaciones_mantenimiento 
       (mantenimiento_id, descripcion, cargo_a, estado_resolucion, creado_por, 
        imagen_url_1, imagen_nombre_1, imagen_url_2, imagen_nombre_2, imagen_url_3, imagen_nombre_3, 
        es_evidencia, firma_url, firma_nombre, firma_fecha, tecnico_asignado_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        mantenimiento_id, 
        descripcion.trim(), 
        cargo_a, 
        estado_resolucion,
        req.user?.id || null, 
        imagen_url_1, 
        imagen_nombre_1,
        imagen_url_2,
        imagen_nombre_2,
        imagen_url_3,
        imagen_nombre_3,
        esEvidenciaBool,
        firma_url,
        firma_nombre,
        firma_url ? new Date() : null,
        tecnicoAsignadoId
      ]
    );

    console.log('✅ Observación guardada correctamente con', req.files?.length || 0, 'imágenes');

    // NUEVO: Enviar notificación por correo si se asignó a un técnico - VERSIÓN MEJORADA
    let notificacionEnviada = false;
    if (tecnicoAsignadoId && tecnicoInfo) {
      try {
        const observacionData = {
          descripcion: descripcion.trim(),
          cargo_a: cargo_a,
          estado_resolucion: estado_resolucion
        };

        console.log('📧 [OBSERVACIONES] Preparando envío de notificación a:', tecnicoInfo.email);
        console.log('👤 [OBSERVACIONES] Técnico:', tecnicoInfo.nombre);
        console.log('📋 [OBSERVACIONES] Observación:', observacionData.descripcion.substring(0, 50) + '...');
        
        // LOGS DE DEBUG
        console.log('🔧 [OBSERVACIONES] Configuración de Brevo:', {
          user: process.env.BREVO_SMTP_USER ? '✅ Configurado' : '❌ No configurado',
          pass: process.env.BREVO_SMTP_PASS ? '✅ Configurado' : '❌ No configurado',
          from: process.env.EMAIL_FROM || 'No configurado'
        });

        // Enviar notificación y ESPERAR la respuesta
        notificacionEnviada = await enviarNotificacionObservacion(
          tecnicoInfo.email,
          tecnicoInfo.nombre,
          observacionData,
          mantenimientoInfo
        );

        if (notificacionEnviada) {
          console.log('✅ [OBSERVACIONES] Notificación enviada exitosamente a:', tecnicoInfo.email);
        } else {
          console.log('⚠️ [OBSERVACIONES] No se pudo enviar notificación a:', tecnicoInfo.email);
        }
        
      } catch (notifError) {
        console.error('❌ [OBSERVACIONES] Error preparando notificación:', notifError);
        // No fallar la operación principal por error en notificación
      }
    }

    // Obtener la observación completa con los nombres de los técnicos
    const observacionCompleta = await pool.query(
      `SELECT om.*,
              u1.nombre as tecnico_nombre,
              u2.nombre as resuelto_por_nombre,
              u3.nombre as tecnico_asignado_nombre
       FROM observaciones_mantenimiento om
       LEFT JOIN "Usuarios" u1 ON om.creado_por = u1.id
       LEFT JOIN "Usuarios" u2 ON om.resuelto_por = u2.id
       LEFT JOIN "Usuarios" u3 ON om.tecnico_asignado_id = u3.id
       WHERE om.id = $1`,
      [result.rows[0].id]
    );

    const mensaje = `Observación agregada correctamente${req.files?.length > 0 ? ` con ${req.files.length} imagen(es)` : ''}${firma_url ? ' y firma' : ''}${tecnicoAsignadoId ? ' y técnico asignado' : ''}`;

    res.json({
      success: true,
      refaccion: observacionCompleta.rows[0],
      message: mensaje,
      notificacion_enviada: notificacionEnviada
    });

  } catch (err) {
    console.error("❌ Error agregando refacción:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al agregar refacción" 
    });
  }
});

// BLOQUE 4: Actualizar observación/refacción - ACTUALIZADO CON TÉCNICO ASIGNADO Y NOTIFICACIÓN MEJORADA
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      descripcion, 
      cargo_a, 
      estado_resolucion, 
      es_evidencia,
      tecnico_asignado_id = null,
      // Nuevos campos para firma
      firma_data,
      firma_nombre,
      resuelto_por,
      resuelto_por_nombre
    } = req.body;

    console.log('📥 PUT /api/refacciones/' + id + ' recibido');
    console.log('📋 Body fields:', req.body);

    // Verificar que la observación existe y obtener datos actuales
    const observacionCheck = await pool.query(
      'SELECT id, firma_url, tecnico_asignado_id, mantenimiento_id FROM observaciones_mantenimiento WHERE id = $1',
      [id]
    );

    if (observacionCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Observación no encontrada" 
      });
    }

    const observacionActual = observacionCheck.rows[0];
    const tecnicoAnteriorId = observacionActual.tecnico_asignado_id;
    
    // NUEVO: Detectar si se está cambiando el técnico asignado
    const tecnicoAsignadoCambiado = tecnico_asignado_id && 
                                   tecnico_asignado_id !== tecnicoAnteriorId &&
                                   tecnico_asignado_id !== '';

    let tecnicoAsignadoId = null;
    let tecnicoInfo = null;
    let mantenimientoInfo = null;

    if (tecnico_asignado_id && tecnico_asignado_id !== '') {
      // Convertir a número entero
      tecnicoAsignadoId = parseInt(tecnico_asignado_id);
      
      console.log('🆔 tecnico_asignado_id recibido:', tecnico_asignado_id, 'Tipo:', typeof tecnico_asignado_id);
      console.log('🆔 tecnico_asignado_id convertido:', tecnicoAsignadoId, 'Tipo:', typeof tecnicoAsignadoId);

      const tecnicoCheck = await pool.query(
        'SELECT id, nombre, email FROM "Usuarios" WHERE id = $1',
        [tecnicoAsignadoId]
      );
      
      if (tecnicoCheck.rows.length === 0) {
        console.log('❌ Técnico asignado no encontrado:', tecnicoAsignadoId);
        return res.status(400).json({ 
          success: false,
          error: "El técnico asignado no existe" 
        });
      }
      
      tecnicoInfo = tecnicoCheck.rows[0];
      console.log('✅ Técnico asignado válido:', tecnicoInfo.nombre);

      // Obtener información del mantenimiento para el correo
      if (tecnicoAsignadoCambiado) {
        try {
          const mantenimientoData = await pool.query(
            `SELECT mp.*, m.numero as montacargas_numero, m."Marca" as montacargas_marca, 
                    m."Modelo" as montacargas_modelo, m."Serie" as montacargas_serie,
                    m."Ubicacion" as montacargas_ubicacion
             FROM observaciones_mantenimiento om
             JOIN mantenimientos_programados mp ON om.mantenimiento_id = mp.id
             JOIN "Montacargas" m ON mp.montacargas_id = m.numero
             WHERE om.id = $1`,
            [id]
          );

          if (mantenimientoData.rows.length > 0) {
            mantenimientoInfo = mantenimientoData.rows[0];
            console.log('✅ Información de mantenimiento obtenida para notificación');
          }
        } catch (infoError) {
          console.error('❌ Error obteniendo información para notificación:', infoError);
        }
      }
    }

    // Convertir es_evidencia a boolean
    const esEvidenciaBool = es_evidencia === 'true' || es_evidencia === true;

    let query = `UPDATE observaciones_mantenimiento 
                 SET descripcion = $1, cargo_a = $2, estado_resolucion = $3, es_evidencia = $4, tecnico_asignado_id = $5`;
    let params = [descripcion, cargo_a, estado_resolucion, esEvidenciaBool, tecnicoAsignadoId];
    let paramCount = 6;

    // Procesar firma digital si está presente
    let firma_url = null;
    if (firma_data && firma_nombre) {
      try {
        console.log('✍️ Procesando firma digital...');
        
        // Validar que sea un base64 válido
        if (!firma_data.startsWith('data:image/')) {
          throw new Error('Formato de firma inválido');
        }
        
        // Convertir base64 a buffer
        const base64Data = firma_data.replace(/^data:image\/\w+;base64,/, '');
        const firmaBuffer = Buffer.from(base64Data, 'base64');
        
        // Validar que el buffer no esté vacío
        if (firmaBuffer.length === 0) {
          throw new Error('La firma está vacía');
        }
        
        // Subir firma a S3
        firma_url = await uploadImageToS3(
          firmaBuffer,
          `firma-${Date.now()}-${firma_nombre.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
          'image/png'
        );
        
        console.log('✅ Firma subida a S3:', firma_url);
        
        // Eliminar firma anterior si existe
        const firmaAnterior = observacionActual.firma_url;
        if (firmaAnterior && firmaAnterior.includes('amazonaws.com')) {
          try {
            await deleteFromS3(firmaAnterior);
            console.log('🗑️ Firma anterior eliminada:', firmaAnterior);
          } catch (deleteError) {
            console.error('⚠️ Error eliminando firma anterior:', deleteError);
            // No detenemos el proceso por este error
          }
        }
        
        // Agregar campos de firma a la consulta
        query += `, firma_url = $${paramCount}, firma_nombre = $${paramCount + 1}, firma_fecha = $${paramCount + 2}`;
        params.push(firma_url, firma_nombre.trim(), new Date());
        paramCount += 3;
        
      } catch (firmaError) {
        console.error('❌ Error subiendo firma a S3:', firmaError);
        return res.status(400).json({ 
          success: false,
          error: `Error al procesar firma: ${firmaError.message}` 
        });
      }
    }

    // Si se marca como resuelto, agregar fecha y usuario
    if (estado_resolucion === 'resuelto') {
      query += `, fecha_resolucion = NOW(), resuelto_por = $${paramCount}`;
      params.push(req.user?.id || resuelto_por || null);
      paramCount++;
    } else if (estado_resolucion === 'pendiente') {
      // Solo limpiar campos de resolución, mantener la firma si existe
      query += `, fecha_resolucion = NULL, resuelto_por = NULL`;
    }

    query += ` WHERE id = $${paramCount} RETURNING *`;
    params.push(id);

    console.log('🔍 Ejecutando query:', query);
    console.log('📊 Params:', params);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "No se pudo actualizar la observación" 
      });
    }

    // NUEVO: Enviar notificación por correo si se cambió el técnico asignado - VERSIÓN MEJORADA
    let notificacionEnviada = false;
    if (tecnicoAsignadoCambiado && tecnicoInfo && mantenimientoInfo) {
      try {
        const observacionData = {
          descripcion: descripcion,
          cargo_a: cargo_a,
          estado_resolucion: estado_resolucion
        };

        console.log('📧 [OBSERVACIONES] Enviando notificación de reasignación a:', tecnicoInfo.email);
        
        // LOGS DE DEBUG
        console.log('🔧 [OBSERVACIONES] Configuración de Brevo para reasignación:', {
          user: process.env.BREVO_SMTP_USER ? '✅ Configurado' : '❌ No configurado',
          pass: process.env.BREVO_SMTP_PASS ? '✅ Configurado' : '❌ No configurado'
        });

        // Enviar notificación y ESPERAR la respuesta
        notificacionEnviada = await enviarNotificacionObservacion(
          tecnicoInfo.email,
          tecnicoInfo.nombre,
          observacionData,
          mantenimientoInfo
        );

        if (notificacionEnviada) {
          console.log('✅ [OBSERVACIONES] Notificación de reasignación enviada a:', tecnicoInfo.email);
        } else {
          console.log('⚠️ [OBSERVACIONES] No se pudo enviar notificación de reasignación a:', tecnicoInfo.email);
        }
        
      } catch (notifError) {
        console.error('❌ [OBSERVACIONES] Error preparando notificación de reasignación:', notifError);
      }
    }

    // Obtener la observación actualizada con información completa
    const observacionActualizada = await pool.query(
      `SELECT om.*, 
              u1.nombre as tecnico_nombre,
              u2.nombre as resuelto_por_nombre,
              u3.nombre as tecnico_asignado_nombre
       FROM observaciones_mantenimiento om
       LEFT JOIN "Usuarios" u1 ON om.creado_por = u1.id
       LEFT JOIN "Usuarios" u2 ON om.resuelto_por = u2.id
       LEFT JOIN "Usuarios" u3 ON om.tecnico_asignado_id = u3.id
       WHERE om.id = $1`,
      [id]
    );

    const mensaje = "Observación actualizada correctamente" + 
                   (firma_url ? " con firma" : "") + 
                   (estado_resolucion === 'resuelto' ? " y marcada como resuelta" : "") +
                   (tecnico_asignado_id ? " y técnico asignado actualizado" : "");

    res.json({
      success: true,
      refaccion: observacionActualizada.rows[0],
      message: mensaje,
      notificacion_enviada: notificacionEnviada
    });

  } catch (err) {
    console.error("❌ Error actualizando refacción:", err);
    res.status(500).json({ 
      success: false,
      error: err.message || "Error al actualizar refacción" 
    });
  }
});

// BLOQUE 5: Eliminar observación/refacción - ACTUALIZADO PARA ELIMINAR FIRMA
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Primero obtener la información para eliminar las imágenes Y firma
    const observacion = await pool.query(
      'SELECT imagen_url_1, imagen_url_2, imagen_url_3, firma_url FROM observaciones_mantenimiento WHERE id = $1',
      [id]
    );

    const result = await pool.query(
      'DELETE FROM observaciones_mantenimiento WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Observación no encontrada" 
      });
    }

    // Eliminar TODAS las imágenes Y firma de AWS S3 si existen
    if (observacion.rows.length > 0) {
      const obs = observacion.rows[0];
      const archivos = [
        obs.imagen_url_1, 
        obs.imagen_url_2, 
        obs.imagen_url_3,
        obs.firma_url  // Agregar firma a la lista de archivos a eliminar
      ];
      
      for (const archivoUrl of archivos) {
        if (archivoUrl && archivoUrl.includes('amazonaws.com')) {
          try {
            await deleteFromS3(archivoUrl);
            console.log('✅ Archivo eliminado de AWS S3:', archivoUrl);
          } catch (error) {
            console.error('❌ Error eliminando archivo de S3:', error);
          }
        }
      }
    }

    res.json({
      success: true,
      message: "Observación/refacción eliminada correctamente"
    });
  } catch (err) {
    console.error("Error eliminando refacción:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al eliminar refacción" 
    });
  }
});

// BLOQUE 6: Eliminar imagen específica (1, 2 o 3) - NUEVO
router.delete("/:id/imagen/:numero", async (req, res) => {
  try {
    const { id, numero } = req.params;
    const imagenNum = parseInt(numero);

    if (imagenNum < 1 || imagenNum > 3) {
      return res.status(400).json({ 
        success: false,
        error: "Número de imagen debe ser 1, 2 o 3" 
      });
    }

    // Obtener la observación
    const observacion = await pool.query(
      `SELECT imagen_url_1, imagen_url_2, imagen_url_3 
       FROM observaciones_mantenimiento WHERE id = $1`,
      [id]
    );

    if (observacion.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Observación no encontrada" 
      });
    }

    const campoImagen = `imagen_url_${imagenNum}`;
    const campoNombre = `imagen_nombre_${imagenNum}`;
    const imagenUrl = observacion.rows[0][campoImagen];

    if (!imagenUrl) {
      return res.status(400).json({ 
        success: false,
        error: "No hay imagen para eliminar" 
      });
    }

    // Eliminar imagen de AWS S3
    await deleteFromS3(imagenUrl);
    console.log('✅ Imagen eliminada de AWS S3:', imagenUrl);

    // Actualizar la observación para quitar la imagen específica
    const query = `UPDATE observaciones_mantenimiento 
                   SET ${campoImagen} = NULL, ${campoNombre} = NULL 
                   WHERE id = $1 RETURNING *`;

    const result = await pool.query(query, [id]);

    res.json({
      success: true,
      refaccion: result.rows[0],
      message: `Imagen ${imagenNum} eliminada correctamente`
    });
  } catch (err) {
    console.error("Error eliminando imagen:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al eliminar imagen" 
    });
  }
});

// BLOQUE 7: Resolver observación específica - ACTUALIZADO PARA FIRMA
router.put("/:id/resolver", async (req, res) => {
  try {
    const { id } = req.params;
    const resuelto_por = req.user?.id || null;

    const result = await pool.query(
      `UPDATE observaciones_mantenimiento 
       SET estado_resolucion = 'resuelto',
           fecha_resolucion = NOW(),
           resuelto_por = $1
       WHERE id = $2
       RETURNING *`,
      [resuelto_por, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Observación no encontrada" 
      });
    }

    // Obtener la observación actualizada con información completa
    const observacionActualizada = await pool.query(
      `SELECT om.*, 
              u1.nombre as tecnico_nombre,
              u2.nombre as resuelto_por_nombre,
              u3.nombre as tecnico_asignado_nombre  -- NUEVO
       FROM observaciones_mantenimiento om
       LEFT JOIN "Usuarios" u1 ON om.creado_por = u1.id
       LEFT JOIN "Usuarios" u2 ON om.resuelto_por = u2.id
       LEFT JOIN "Usuarios" u3 ON om.tecnico_asignado_id = u3.id  -- NUEVO JOIN
       WHERE om.id = $1`,
      [id]
    );

    res.json({
      success: true,
      observacion: observacionActualizada.rows[0],
      message: "Observación marcada como resuelta"
    });

  } catch (err) {
    console.error("Error al resolver observación:", err);
    res.status(500).json({ 
      success: false,
      error: "Error interno del servidor" 
    });
  }
});

// BLOQUE 8: Obtener estadísticas de refacciones
router.get("/estadisticas", async (req, res) => {
  try {
    const estados = await pool.query(
      `SELECT estado_resolucion, COUNT(*) as total
       FROM observaciones_mantenimiento 
       GROUP BY estado_resolucion`
    );

    const cargos = await pool.query(
      `SELECT cargo_a, COUNT(*) as total
       FROM observaciones_mantenimiento 
       GROUP BY cargo_a`
    );

    const mensual = await pool.query(
      `SELECT 
         DATE_TRUNC('month', creado_en) as mes,
         COUNT(*) as total
       FROM observaciones_mantenimiento 
       GROUP BY DATE_TRUNC('month', creado_en)
       ORDER BY mes DESC
       LIMIT 12`
    );

    // Estadísticas por tipo (evidencia vs observación normal)
    const porTipo = await pool.query(
      `SELECT es_evidencia, COUNT(*) as total
       FROM observaciones_mantenimiento 
       GROUP BY es_evidencia`
    );

    // NUEVO: Estadísticas por técnico asignado
    const porTecnicoAsignado = await pool.query(
      `SELECT 
         u.nombre as tecnico_nombre,
         COUNT(*) as total
       FROM observaciones_mantenimiento om
       LEFT JOIN "Usuarios" u ON om.tecnico_asignado_id = u.id
       GROUP BY u.nombre
       ORDER BY total DESC`
    );

    res.json({
      success: true,
      estadisticas: {
        por_estado: estados.rows,
        por_cargo: cargos.rows,
        mensual: mensual.rows,
        por_tipo: porTipo.rows,
        por_tecnico_asignado: porTecnicoAsignado.rows  // NUEVO
      }
    });
  } catch (err) {
    console.error("Error obteniendo estadísticas:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al obtener estadísticas" 
    });
  }
});

// BLOQUE 9: Obtener observaciones resueltas del mes actual - ACTUALIZADO CON TÉCNICO ASIGNADO
router.get("/observaciones-resueltas-mes", async (req, res) => {
  try {
    const { mes, anio } = req.query;
    
    // Si no se proporcionan mes y año, usar el mes actual
    const mesActual = mes ? parseInt(mes) : new Date().getMonth() + 1;
    const anioActual = anio ? parseInt(anio) : new Date().getFullYear();

    console.log(`📊 Buscando observaciones resueltas para mes: ${mesActual}, año: ${anioActual}`);

    const q = await pool.query(
      `SELECT 
        om.*,
        mp.tipo as mantenimiento_tipo,
        mp.fecha as mantenimiento_fecha,
        m.numero as montacargas_numero,
        m."Marca" as montacargas_marca,
        m."Modelo" as montacargas_modelo,
        m."Serie" as montacargas_serie,
        m."Ubicacion" as montacargas_ubicacion,
        u1.nombre as tecnico_nombre,
        u2.nombre as resuelto_por_nombre,
        u3.nombre as tecnico_asignado_nombre  -- NUEVO
       FROM observaciones_mantenimiento om
       JOIN mantenimientos_programados mp ON om.mantenimiento_id = mp.id
       JOIN "Montacargas" m ON mp.montacargas_id = m.numero
       LEFT JOIN "Usuarios" u1 ON om.creado_por = u1.id
       LEFT JOIN "Usuarios" u2 ON om.resuelto_por = u2.id
       LEFT JOIN "Usuarios" u3 ON om.tecnico_asignado_id = u3.id  -- NUEVO JOIN
       WHERE om.estado_resolucion = 'resuelto'
         AND EXTRACT(MONTH FROM om.fecha_resolucion) = $1
         AND EXTRACT(YEAR FROM om.fecha_resolucion) = $2
       ORDER BY om.fecha_resolucion DESC`,
      [mesActual, anioActual]
    );

    console.log(`✅ Encontradas ${q.rows.length} observaciones resueltas`);

    res.json({
      success: true,
      observaciones: q.rows,
      mes: mesActual,
      anio: anioActual,
      total: q.rows.length
    });
  } catch (err) {
    console.error("❌ Error obteniendo observaciones resueltas:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al obtener observaciones resueltas" 
    });
  }
});

// BLOQUE 10: Obtener observaciones por técnico asignado - NUEVO
router.get("/tecnico/:tecnicoId", async (req, res) => {
  try {
    const { tecnicoId } = req.params;

    const q = await pool.query(
      `SELECT 
        om.*,
        mp.tipo as mantenimiento_tipo,
        mp.fecha as mantenimiento_fecha,
        m.numero as montacargas_numero,
        m."Marca" as montacargas_marca,
        m."Modelo" as montacargas_modelo,
        m."Serie" as montacargas_serie,
        u1.nombre as tecnico_nombre,
        u2.nombre as resuelto_por_nombre,
        u3.nombre as tecnico_asignado_nombre
       FROM observaciones_mantenimiento om
       JOIN mantenimientos_programados mp ON om.mantenimiento_id = mp.id
       JOIN "Montacargas" m ON mp.montacargas_id = m.numero
       LEFT JOIN "Usuarios" u1 ON om.creado_por = u1.id
       LEFT JOIN "Usuarios" u2 ON om.resuelto_por = u2.id
       LEFT JOIN "Usuarios" u3 ON om.tecnico_asignado_id = u3.id
       WHERE om.tecnico_asignado_id = $1
       ORDER BY om.creado_en DESC`,
      [tecnicoId]
    );

    res.json({
      success: true,
      observaciones: q.rows,
      total: q.rows.length
    });
  } catch (err) {
    console.error("Error obteniendo observaciones por técnico:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al obtener observaciones" 
    });
  }
});

// BLOQUE 11: Obtener observaciones pendientes por técnico - NUEVO
router.get("/tecnico/:tecnicoId/pendientes", async (req, res) => {
  try {
    const { tecnicoId } = req.params;

    const q = await pool.query(
      `SELECT 
        om.*,
        mp.tipo as mantenimiento_tipo,
        mp.fecha as mantenimiento_fecha,
        m.numero as montacargas_numero,
        m."Marca" as montacargas_marca,
        m."Modelo" as montacargas_modelo,
        m."Serie" as montacargas_serie,
        u1.nombre as tecnico_nombre,
        u3.nombre as tecnico_asignado_nombre
       FROM observaciones_mantenimiento om
       JOIN mantenimientos_programados mp ON om.mantenimiento_id = mp.id
       JOIN "Montacargas" m ON mp.montacargas_id = m.numero
       LEFT JOIN "Usuarios" u1 ON om.creado_por = u1.id
       LEFT JOIN "Usuarios" u3 ON om.tecnico_asignado_id = u3.id
       WHERE om.tecnico_asignado_id = $1 
         AND om.estado_resolucion = 'pendiente'
       ORDER BY om.creado_en DESC`,
      [tecnicoId]
    );

    res.json({
      success: true,
      observaciones: q.rows,
      total: q.rows.length
    });
  } catch (err) {
    console.error("Error obteniendo observaciones pendientes por técnico:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al obtener observaciones pendientes" 
    });
  }
});

module.exports = router;