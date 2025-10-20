const cloudinary = require('cloudinary').v2;

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Cloudinary configurado con cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);

// Función para subir archivo a Cloudinary - MEJORADA
const uploadToCloudinary = async (fileBuffer, fileName) => {
  try {
    // Determinar el resource_type basado en la extensión
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const isPDF = fileExtension === 'pdf';
    const isDocument = ['doc', 'docx', 'txt'].includes(fileExtension);
    const resourceType = (isPDF || isDocument) ? 'raw' : 'auto';

    console.log(`Subiendo archivo: ${fileName}, Tipo: ${resourceType}`);

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: 'montacargas',
          public_id: fileName.replace(/\.[^/.]+$/, ""),
          // IMPORTANTE: No usar format para archivos raw
          ...(resourceType === 'raw' ? {} : { format: 'pdf' })
        },
        (error, result) => {
          if (error) {
            console.error('❌ Error subiendo a Cloudinary:', error);
            reject(error);
          } else {
            console.log('✅ Archivo subido a Cloudinary:', result.secure_url);
            resolve(result.secure_url);
          }
        }
      ).end(fileBuffer);
    });
  } catch (error) {
    console.error('❌ Error en uploadToCloudinary:', error);
    throw error;
  }
};

// Función para eliminar archivo de Cloudinary - MEJORADA
const deleteFromCloudinary = async (fileUrl) => {
  if (!fileUrl) return { result: 'not_deleted' };
  
  try {
    // Extraer el public_id de la URL
    const parts = fileUrl.split('/');
    const publicIdWithExtension = parts[parts.length - 1];
    const publicId = 'montacargas/' + publicIdWithExtension.split('.')[0];
    
    console.log('🗑️ Eliminando de Cloudinary:', publicId);
    
    // Determinar el resource_type basado en la URL
    const isRaw = fileUrl.includes('/raw/') || 
                  fileUrl.toLowerCase().includes('.pdf') ||
                  fileUrl.toLowerCase().includes('.doc') ||
                  fileUrl.toLowerCase().includes('.txt');
    const resourceType = isRaw ? 'raw' : 'image';
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    console.log('✅ Resultado eliminación:', result);
    return result;
  } catch (error) {
    console.error('❌ Error eliminando de Cloudinary:', error);
    // No lanzar error para evitar bloquear la aplicación
    return { result: 'error', message: error.message };
  }
};

// Función para obtener URL de descarga directa - MEJORADA
const getDownloadUrl = (fileUrl) => {
  if (!fileUrl) return null;
  
  // Si ya es una URL de raw, no modificar
  if (fileUrl.includes('/raw/')) {
    return fileUrl;
  }
  
  // Si es una URL de image, forzar descarga como attachment
  if (fileUrl.includes('/image/')) {
    return fileUrl.replace('/upload/', '/upload/fl_attachment/');
  }
  
  // Para URLs antiguas, asumir que son raw
  return fileUrl.replace('/upload/', '/upload/raw/');
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getDownloadUrl
};