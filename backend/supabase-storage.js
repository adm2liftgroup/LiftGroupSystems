const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME;

// Subir archivo a Supabase Storage
const uploadToSupabase = async (fileBuffer, fileName, mimetype) => {
  try {
    console.log(`📤 Subiendo a Supabase: ${fileName}`);
    
    // Limpiar nombre de archivo
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `documents/${Date.now()}-${cleanFileName}`;
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: mimetype || 'application/pdf',
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

// Eliminar archivo de Supabase
const deleteFromSupabase = async (fileUrl) => {
  try {
    if (!fileUrl || !fileUrl.includes('supabase.co')) return;
    
    // Extraer path de la URL: documents/12345-archivo.pdf
    const urlParts = fileUrl.split('/');
    const filePath = urlParts[urlParts.length - 1];
    
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
  deleteFromSupabase
};