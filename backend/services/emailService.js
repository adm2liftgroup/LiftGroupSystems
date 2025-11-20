const axios = require('axios');

class EmailService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.baseURL = 'https://api.brevo.com/v3/smtp/email';
  }

  async enviarVerificacionEmail(usuario, tokenVerificacion) {
  try {
    console.log('📧 Preparando email de verificación para:', usuario.email);
    
    const verifyUrl = `https://liftgroup-frontend.onrender.com/verify-success?token=${tokenVerificacion}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 25px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
          .button { background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Verifica tu Cuenta - LiftGroup</h1>
          </div>
          <div class="content">
            <h2>Hola ${usuario.nombre},</h2>
            <p>¡Gracias por registrarte en LiftGroup Systems!</p>
            <p>Para activar tu cuenta, haz clic en el siguiente botón:</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${verifyUrl}" class="button" style="color: white;">
                Verificar Mi Cuenta
              </a>
            </div>
            
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all;">
              ${verifyUrl}
            </p>
            
            <p>Este enlace expirará en 24 horas.</p>
            
            <div class="footer">
              <p>Saludos cordiales,<br><strong>Equipo LiftGroup Systems</strong></p>
              <p style="font-size: 12px; color: #999;">Si no te registraste, puedes ignorar este mensaje.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await axios.post(
      this.baseURL,
      {
        sender: {
          name: 'LiftGroup Systems',
          email: process.env.SMTP_FROM || 'notificaciones@liftgroup-systems.com'
        },
        to: [
          {
            email: usuario.email,
            name: usuario.nombre
          }
        ],
        subject: '🔐 Verifica tu cuenta - LiftGroup Systems',
        htmlContent: htmlContent
      },
      {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Email de verificación enviado. Message ID:', response.data.messageId);
    return { success: true, messageId: response.data.messageId };
    
  } catch (error) {
    console.error('❌ Error enviando email de verificación:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(`Error API Brevo: ${error.response?.data?.message || error.message}`);
  }
}
  async enviarAsignacionTecnico(tecnico, mantenimiento) {
    try {
      console.log('📧 Preparando email para:', tecnico.email);
      
      const htmlContent = this.crearTemplateEmail(tecnico, mantenimiento);

      const response = await axios.post(
        this.baseURL,
        {
          sender: {
            name: 'LiftGroup Systems',
            email: process.env.SMTP_FROM || 'notificaciones@liftgroup-systems.com'
          },
          to: [
            {
              email: tecnico.email,
              name: tecnico.nombre
            }
          ],
          subject: `📋 Nueva asignación - Mantenimiento ${mantenimiento.id}`,
          htmlContent: htmlContent
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          timeout: 10000 // 10 segundos timeout
        }
      );

      console.log('✅ Email enviado via API Brevo. Message ID:', response.data.messageId);
      return { success: true, messageId: response.data.messageId };
      
    } catch (error) {
      console.error('❌ Error enviando email via API Brevo:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Error API Brevo: ${error.response?.data?.message || error.message}`);
    }
  }

  crearTemplateEmail(tecnico, mantenimiento) {
    const fechaFormateada = new Date(mantenimiento.fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 25px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #3B82F6; margin: 15px 0; }
          .button { background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 Nueva Asignación de Mantenimiento</h1>
          </div>
          <div class="content">
            <h2>Hola ${tecnico.nombre},</h2>
            <p>Has sido asignado a un nuevo mantenimiento de montacargas en el sistema LiftGroup.</p>
            
            <div class="info-box">
              <h3>📋 Detalles del Mantenimiento:</h3>
              <ul>
                <li><strong>ID Mantenimiento:</strong> ${mantenimiento.id}</li>
                <li><strong>Montacargas:</strong> #${mantenimiento.numero}</li>
                <li><strong>Marca/Modelo:</strong> ${mantenimiento.Marca} ${mantenimiento.Modelo}</li>
                <li><strong>Tipo:</strong> ${mantenimiento.tipo}</li>
                <li><strong>Fecha Programada:</strong> ${fechaFormateada}</li>
                ${mantenimiento.montacargas_ubicacion ? `<li><strong>Ubicación:</strong> ${mantenimiento.montacargas_ubicacion}</li>` : ''}
              </ul>
            </div>
            
            <p>Por favor, inicia sesión en el sistema para ver los detalles completos y actualizar el estado del mantenimiento.</p>
            
            <div class="footer">
              <p>Saludos cordiales,<br><strong>Equipo LiftGroup Systems</strong></p>
              <p style="font-size: 12px; color: #999;">Este es un mensaje automático, por favor no respondas a este correo.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  async enviarAsignacionObservacion(tecnico, observacionData, mantenimientoData) {
    try {
      console.log('📧 [EMAIL SERVICE] Preparando email de observación para:', tecnico.email);
      
      const htmlContent = this.crearTemplateEmailObservacion(tecnico, observacionData, mantenimientoData);

      const response = await axios.post(
        this.baseURL,
        {
          sender: {
            name: 'LiftGroup Systems',
            email: process.env.SMTP_FROM || 'notificaciones@liftgroup-systems.com'
          },
          to: [
            {
              email: tecnico.email,
              name: tecnico.nombre
            }
          ],
          subject: `🔍 Nueva Observación Asignada - Mantenimiento ${mantenimientoData.id}`,
          htmlContent: htmlContent
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('✅ [EMAIL SERVICE] Email de observación enviado. Message ID:', response.data.messageId);
      return { success: true, messageId: response.data.messageId };
      
    } catch (error) {
      console.error('❌ [EMAIL SERVICE] Error enviando email de observación:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Error API Brevo: ${error.response?.data?.message || error.message}`);
    }
  }

  // NUEVA PLANTILLA: Crear template específico para observaciones
  crearTemplateEmailObservacion(tecnico, observacionData, mantenimientoData) {
    const fechaCreacion = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 650px; 
            margin: 0 auto; 
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content { 
            padding: 30px; 
          }
          .info-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .info-section h3 {
            color: #2d3748;
            margin-top: 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .observation-details {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
          }
          .actions-required {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
          }
          .button { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block;
            font-weight: 600;
            text-align: center;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #e2e8f0; 
            color: #718096; 
            font-size: 14px;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin: 2px;
          }
          .badge-pending { background: #fff3cd; color: #856404; }
          .badge-empresa { background: #cce7ff; color: #004085; }
          .badge-cliente { background: #ffe6cc; color: #663c00; }
          ul { padding-left: 20px; }
          li { margin-bottom: 8px; }
          .highlight {
            background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: center;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔍 Nueva Observación de Mantenimiento</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Se te ha asignado una nueva observación que requiere tu atención</p>
          </div>
          <div class="content">
            <div class="highlight">
              <h2 style="margin: 0; color: #2d3748;">Hola ${tecnico.nombre},</h2>
              <p style="margin: 5px 0 0 0;">Se te ha asignado una nueva observación de mantenimiento que requiere tu atención.</p>
            </div>
            
            <div class="info-section">
              <h3>📋 Información del Equipo:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Montacargas:</strong> #${mantenimientoData.montacargas_numero || mantenimientoData.numero}</li>
                <li><strong>Marca/Modelo:</strong> ${mantenimientoData.montacargas_marca || mantenimientoData.Marca} ${mantenimientoData.montacargas_modelo || mantenimientoData.Modelo}</li>
                <li><strong>Serie:</strong> ${mantenimientoData.montacargas_serie || mantenimientoData.Serie}</li>
                <li><strong>Ubicación:</strong> ${mantenimientoData.montacargas_ubicacion || mantenimientoData.Ubicacion || 'CMI'}</li>
                <li><strong>Mantenimiento:</strong> ${mantenimientoData.tipo} - ${mantenimientoData.mes ? ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][mantenimientoData.mes-1] : ''} ${mantenimientoData.anio}</li>
              </ul>
            </div>

            <div class="info-section">
              <h3>🔍 Detalles de la Observación:</h3>
              <div class="observation-details">
                <p style="margin: 0; font-style: italic; background: white; padding: 15px; border-radius: 5px; border-left: 3px solid #667eea;">
                  "${observacionData.descripcion}"
                </p>
              </div>
              <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px;">
                <span class="badge badge-${observacionData.cargo_a}">
                  Cargo: ${observacionData.cargo_a === 'empresa' ? 'Cargo a Empresa' : 'Cargo a Cliente'}
                </span>
                <span class="badge badge-pending">
                  Estado: Pendiente de Resolución
                </span>
              </div>
              <p style="margin-top: 15px; color: #666;">
                <strong>Fecha de creación:</strong> ${fechaCreacion}
              </p>
            </div>

            <div class="info-section">
              <h3>📝 Acciones Requeridas:</h3>
              <div class="actions-required">
                <ul>
                  <li>Revisar la observación asignada en el sistema</li>
                  <li>Completar la tarea con firma digital</li>
                  <li>Agregar imágenes como evidencia si es necesario</li>
                  <li>Marcar como resuelto cuando finalice</li>
                </ul>
              </div>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="https://liftgroup-frontend.onrender.com" class="button">
                👉 Ver Observación en el Sistema
              </a>
            </div>

            <div class="footer">
              <p>Saludos cordiales,<br><strong>Equipo LiftGroup Systems</strong></p>
              <p style="font-size: 12px; color: #999; margin-top: 10px;">
                Este es un mensaje automático, por favor no respondas a este correo.<br>
                Si crees que recibiste este mensaje por error, contacta al administrador del sistema.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

}


module.exports = new EmailService();