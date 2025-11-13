const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME;

// Subir archivo a Supabase Storage (para documentos PDF)
const uploadToSupabase = async (fileBuffer, fileName, mimetype, folder = 'documents') => {
  try {
    console.log(`📤 Subiendo a Supabase: ${fileName}`);
    
    // Limpiar nombre de archivo
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${folder}/${Date.now()}-${cleanFileName}`;
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Error subiendo a Supabase:', error);
      throw error;
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    console.log('✅ Subido a Supabase:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('❌ Error en uploadToSupabase:', error);
    throw error;
  }
};

// Subir imagen a Supabase Storage (para imágenes de refacciones)
const uploadImageToSupabase = async (fileBuffer, fileName, mimetype) => {
  try {
    console.log(`🖼️ Subiendo imagen a Supabase: ${fileName}`);
    
    // Limpiar nombre de archivo
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `refacciones-images/${Date.now()}-${cleanFileName}`;
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Error subiendo imagen a Supabase:', error);
      throw error;
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    console.log('✅ Imagen subida a Supabase:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('❌ Error en uploadImageToSupabase:', error);
    throw error;
  }
};

// Eliminar archivo de Supabase
const deleteFromSupabase = async (fileUrl) => {
  try {
    if (!fileUrl || !fileUrl.includes('supabase.co')) return;
    
    // Extraer path de la URL: documents/12345-archivo.pdf o refacciones-images/12345-foto.jpg
    const urlParts = fileUrl.split('/');
    const filePath = urlParts.slice(urlParts.indexOf('storage') + 2).join('/');
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('❌ Error eliminando de Supabase:', error);
      return;
    }
    
    console.log('✅ Eliminado de Supabase:', filePath);
  } catch (error) {
    console.error('❌ Error en deleteFromSupabase:', error);
  }
};

module.exports = {
  uploadToSupabase,
  uploadImageToSupabase,
  deleteFromSupabase
};