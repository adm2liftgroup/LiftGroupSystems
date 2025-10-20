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
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'montacargas',
          public_id: fileName,
          type: 'upload',
          access_mode: 'public' // Intentar hacer público desde el inicio
        },
        async (error, result) => {
          if (error) {
            console.error('❌ Error subiendo a Cloudinary:', error);
            reject(error);
          } else {
            console.log('✅ Archivo subido correctamente');
            console.log('🔓 Access mode:', result.access_mode);
            
            // ⭐⭐ VERIFICACIÓN EXTRA: Si no es público, forzarlo
            if (result.access_mode !== 'public') {
              console.log('⚠️ Archivo no es público, forzando...');
              try {
                const explicitResult = await cloudinary.uploader.explicit(result.public_id, {
                  resource_type: 'raw',
                  type: 'upload',
                  access_mode: 'public'
                });
                console.log('✅ Archivo hecho público via explicit()');
                resolve(explicitResult.secure_url);
              } catch (explicitError) {
                console.error('❌ Error haciendo público:', explicitError);
                // Aún así devolver la URL, intentaremos con URLs firmadas
                resolve(result.secure_url);
              }
            } else {
              resolve(result.secure_url);
            }
          }
        }
      );
      
      uploadStream.end(fileBuffer);
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
    
    // Extraer el public_id de la URL de Cloudinary - MÉTODO MEJORADO
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
    
    // ⭐⭐ CORRECCIÓN CRÍTICA: NO remover la extensión y decodificar URL
    let publicId = publicIdParts.join('/');
    
    // Decodificar caracteres especiales como %5B -> [
    try {
      publicId = decodeURIComponent(publicId);
    } catch (e) {
      console.log('⚠️ No se pudo decodificar publicId, usando original');
    }
    
    console.log('🔍 Public ID extraído (CON extensión):', publicId);
    
    // Eliminar como raw file
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
      invalidate: true // Forzar invalidación de CDN
    });
    
    console.log('✅ Resultado eliminación Cloudinary:', result);
    
    if (result.result !== 'ok') {
      console.warn('⚠️ Cloudinary reportó:', result.result);
      
      // ⭐⭐ INTENTAR ALTERNATIVA: Quizás el archivo está en una subcarpeta diferente
      if (result.result === 'not found') {
        console.log('🔄 Intentando alternativa...');
        // Intentar sin la carpeta "montacargas/"
        const altPublicId = publicId.replace(/^montacargas\//, '');
        if (altPublicId !== publicId) {
          console.log('🔍 Public ID alternativo:', altPublicId);
          const altResult = await cloudinary.uploader.destroy(altPublicId, {
            resource_type: 'raw',
            invalidate: true
          });
          console.log('✅ Resultado eliminación alternativa:', altResult);
          return altResult;
        }
      }
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
  
  // Para archivos raw en Cloudinary, forzar descarga
  if (fileUrl.includes('cloudinary')) {
    // Simplificar: siempre agregar fl_attachment para forzar descarga
    const separator = fileUrl.includes('?') ? '&' : '?';
    return fileUrl + separator + 'fl_attachment';
  }
  
  return fileUrl;
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getDownloadUrl,
  downloadFromCloudinary
};