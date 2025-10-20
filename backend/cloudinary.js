const cloudinary = require('cloudinary').v2;

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Cloudinary configurado con cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);

// Función para subir archivo a Cloudinary - CORREGIDA PARA MANTENER EXTENSIÓN
const uploadToCloudinary = async (fileBuffer, fileName) => {
  try {
    // Determinar el resource_type basado en la extensión
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const isPDF = fileExtension === 'pdf';
    const isDocument = ['doc', 'docx', 'txt'].includes(fileExtension);
    const resourceType = (isPDF || isDocument) ? 'raw' : 'auto';

    console.log(`Subiendo archivo: ${fileName}, Tipo: ${resourceType}, Extensión: ${fileExtension}`);

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: 'montacargas',
          // MANTENER la extensión original en el public_id
          public_id: fileName.replace(/\.[^/.]+$/, ""), // Solo el nombre sin extensión
          // Forzar el formato y tipo MIME correctos
          format: fileExtension, // Usar la extensión real
          type: 'upload',
          ...(resourceType === 'raw' ? {
            // Para archivos raw, asegurar que se descarguen correctamente
            access_mode: 'public',
            asset_folder: 'montacargas'
          } : {})
        },
        (error, result) => {
          if (error) {
            console.error('❌ Error subiendo a Cloudinary:', error);
            reject(error);
          } else {
            console.log('✅ Archivo subido a Cloudinary:', result.secure_url);
            console.log('📁 Tipo de recurso:', result.resource_type);
            console.log('📊 Formato:', result.format);
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

// Función para eliminar archivo de Cloudinary
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
    return { result: 'error', message: error.message };
  }
};

// Función para obtener URL de descarga directa - MEJORADA PARA FORZAR DESCARGA CORRECTA
const getDownloadUrl = (fileUrl) => {
  if (!fileUrl) return null;
  
  console.log('🔗 URL original de Cloudinary:', fileUrl);
  
  // Si es una URL de raw, forzar descarga con parámetros correctos
  if (fileUrl.includes('/raw/')) {
    // Para archivos raw, usar fl_attachment para forzar descarga
    const downloadUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
    console.log('⬇️ URL de descarga raw:', downloadUrl);
    return downloadUrl;
  }
  
  // Si es una URL de image, también forzar descarga
  if (fileUrl.includes('/image/')) {
    const downloadUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
    console.log('⬇️ URL de descarga image:', downloadUrl);
    return downloadUrl;
  }
  
  // Para cualquier otra URL, forzar descarga
  const downloadUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
  console.log('⬇️ URL de descarga genérica:', downloadUrl);
  return downloadUrl;
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getDownloadUrl
};