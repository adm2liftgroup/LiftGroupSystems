const cloudinary = require('cloudinary').v2;
const stream = require('stream');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Cloudinary configurado con cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);

// Función para subir archivo a Cloudinary
const uploadToCloudinary = (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    // Determinar el resource_type basado en la extensión del archivo
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const isPDF = fileExtension === 'pdf';
    const resourceType = isPDF ? 'raw' : 'auto'; // 'raw' para PDFs, 'auto' para otros

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType, // ← CORRECCIÓN IMPORTANTE
        folder: 'montacargas',
        public_id: fileName.replace(/\.[^/.]+$/, ""),
        // Quitar el format forzado para permitir diferentes tipos de archivo
      },
      (error, result) => {
        if (error) {
          console.error('❌ Error subiendo a Cloudinary:', error);
          reject(error);
        } else {
          console.log('✅ Archivo subido a Cloudinary:', fileName, 'Tipo:', resourceType);
          resolve(result.secure_url);
        }
      }
    );

    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);
    bufferStream.pipe(uploadStream);
  });
};

// Función para eliminar archivo de Cloudinary - CORREGIDA
const deleteFromCloudinary = async (fileUrl) => {
  if (!fileUrl) return;
  
  try {
    // Extraer el public_id de la URL
    const parts = fileUrl.split('/');
    const publicIdWithExtension = parts[parts.length - 1];
    const publicId = 'montacargas/' + publicIdWithExtension.split('.')[0];
    
    console.log('🗑️ Eliminando de Cloudinary:', publicId);
    
    // Determinar el resource_type basado en la URL
    const isPDF = fileUrl.includes('/raw/') || fileUrl.toLowerCase().includes('.pdf');
    const resourceType = isPDF ? 'raw' : 'image';
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType // ← CORRECCIÓN IMPORTANTE
    });
    
    console.log('✅ Resultado eliminación:', result);
    return result;
  } catch (error) {
    console.error('❌ Error eliminando de Cloudinary:', error);
    // No lanzar error para evitar bloquear la aplicación
    return { result: 'error', message: error.message };
  }
};

// Función para obtener URL de descarga directa - CORREGIDA
const getDownloadUrl = (fileUrl) => {
  if (!fileUrl) return null;
  
  // Para archivos raw (PDFs), Cloudinary ya proporciona descarga directa
  // Para imágenes, forzar descarga
  if (fileUrl.includes('/raw/')) {
    return fileUrl; // Los raw files ya son descargables
  } else {
    return fileUrl.replace('/upload/', '/upload/fl_attachment/');
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getDownloadUrl
};