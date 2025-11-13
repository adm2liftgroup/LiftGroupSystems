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
}


module.exports = new EmailService();