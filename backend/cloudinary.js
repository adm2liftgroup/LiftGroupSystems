const cloudinary = require('cloudinary').v2;

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Cloudinary configurado con cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);

// Función para subir archivo a Cloudinary - SOLUCIÓN DEFINITIVA
const uploadToCloudinary = async (fileBuffer, fileName) => {
  try {
    console.log(`📤 Subiendo archivo a Cloudinary: ${fileName}`);

    return new Promise((resolve, reject) => {
      // SUBIR COMO ARCHIVO RAW SIN PROCESAMIENTO
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw', // ← CRÍTICO: Siempre como raw
          folder: 'montacargas',
          public_id: fileName, // ← CRÍTICO: Mantener nombre completo con extensión
          type: 'upload',
          access_mode: 'public'
        },
        (error, result) => {
          if (error) {
            console.error('❌ Error subiendo a Cloudinary:', error);
            reject(error);
          } else {
            console.log('✅ Archivo subido correctamente a Cloudinary');
            console.log('🔗 URL:', result.secure_url);
            console.log('📊 Tipo:', result.resource_type);
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

// Función para eliminar archivo de Cloudinary - CORREGIDA
const deleteFromCloudinary = async (fileUrl) => {
  if (!fileUrl) {
    console.log('ℹ️ No hay URL para eliminar');
    return { result: 'not_deleted' };
  }
  
  try {
    console.log('🗑️ Intentando eliminar de Cloudinary:', fileUrl);
    
    // Extraer el public_id de la URL de Cloudinary
    const urlParts = fileUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex === -1) {
      console.error('❌ URL de Cloudinary inválida');
      return { result: 'invalid_url' };
    }
    
    // Reconstruir el public_id (todo después de /upload/version/)
    const versionIndex = uploadIndex + 1;
    if (versionIndex >= urlParts.length) {
      console.error('❌ URL de Cloudinary incompleta');
      return { result: 'invalid_url' };
    }
    
    const publicIdParts = urlParts.slice(versionIndex + 1);
    const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, ""); // Remover extensión
    
    console.log('🔍 Public ID extraído:', publicId);
    
    // Eliminar como raw file
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
      invalidate: true // Forzar invalidación de CDN
    });
    
    console.log('✅ Resultado eliminación Cloudinary:', result);
    
    if (result.result !== 'ok') {
      console.warn('⚠️ Cloudinary reportó:', result.result);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error eliminando de Cloudinary:', error);
    console.error('📝 Detalles del error:', error.message);
    return { result: 'error', message: error.message };
  }
};

// Función para descargar archivo de Cloudinary
const downloadFromCloudinary = async (publicId) => {
  try {
    console.log(`📥 Descargando archivo de Cloudinary: ${publicId}`);
    
    return new Promise((resolve, reject) => {
      cloudinary.uploader.download(publicId, {
        resource_type: 'raw'
      }, (error, result) => {
        if (error) {
          console.error('❌ Error descargando de Cloudinary:', error);
          reject(error);
        } else {
          console.log('✅ Archivo descargado correctamente de Cloudinary');
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.error('❌ Error en downloadFromCloudinary:', error);
    throw error;
  }
};

// Función para obtener URL de descarga directa - SIMPLIFICADA
const getDownloadUrl = (fileUrl) => {
  if (!fileUrl) return null;
  
  console.log('🔗 Procesando URL para descarga:', fileUrl);
  
  // Para archivos raw en Cloudinary, podemos forzar la descarga
  // agregando el parámetro fl_attachment
  if (fileUrl.includes('cloudinary')) {
    // Si ya tiene parámetros, agregar fl_attachment, sino agregar parámetros
    if (fileUrl.includes('?')) {
      return fileUrl + '&fl_attachment';
    } else {
      return fileUrl + '?fl_attachment';
    }
  }
  
  return fileUrl;
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getDownloadUrl,
  downloadFromCloudinary
};