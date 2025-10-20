const cloudinary = require('cloudinary').v2;
const stream = require('stream');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Función para subir archivo a Cloudinary
const uploadToCloudinary = (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    // Crear un stream de lectura desde el buffer
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto', // Detecta automáticamente si es PDF, imagen, etc.
        folder: 'montacargas', // Carpeta en Cloudinary
        public_id: fileName.replace(/\.[^/.]+$/, ""), // Remover extensión
        format: 'pdf' // Forzar formato PDF si es necesario
      },
      (error, result) => {
        if (error) {
          console.error('Error uploading to Cloudinary:', error);
          reject(error);
        } else {
          console.log('Archivo subido a Cloudinary:', result.secure_url);
          resolve(result.secure_url); // Retorna la URL pública
        }
      }
    );

    // Crear un stream desde el buffer y pipe al upload stream
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);
    bufferStream.pipe(uploadStream);
  });
};

// Función para eliminar archivo de Cloudinary
const deleteFromCloudinary = async (fileUrl) => {
  if (!fileUrl) return;
  
  try {
    // Extraer el public_id de la URL
    const parts = fileUrl.split('/');
    const publicIdWithExtension = parts[parts.length - 1];
    const publicId = 'montacargas/' + publicIdWithExtension.split('.')[0];
    
    console.log('Eliminando de Cloudinary:', publicId);
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw' // Para PDFs usar 'raw', para imágenes 'image'
    });
    
    console.log('Resultado eliminación:', result);
    return result;
  } catch (error) {
    console.error('Error eliminando de Cloudinary:', error);
    throw error;
  }
};

// Función para obtener URL de descarga directa
const getDownloadUrl = (fileUrl) => {
  if (!fileUrl) return null;
  
  // Cloudinary ya da URLs públicas, pero podemos forzar descarga
  return fileUrl.replace('/upload/', '/upload/fl_attachment/');
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getDownloadUrl
};