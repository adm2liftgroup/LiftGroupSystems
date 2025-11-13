const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// Subir imagen a S3 - SIN ACL
const uploadImageToS3 = async (fileBuffer, fileName, mimetype) => {
  try {
    console.log(`📤 Subiendo a AWS S3: ${fileName}`);
    
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `refacciones-images/${Date.now()}-${cleanFileName}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: fileBuffer,
      ContentType: mimetype
      // ❌ REMOVED: ACL: 'public-read'
    });

    await s3Client.send(command);

    const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`;
    
    console.log('✅ Imagen subida a S3:', imageUrl);
    return imageUrl;
    
  } catch (error) {
    console.error('❌ Error subiendo a S3:', error);
    throw error;
  }
};

// Eliminar imagen de S3
const deleteFromS3 = async (fileUrl) => {
  try {
    if (!fileUrl || !fileUrl.includes('amazonaws.com')) return;
    
    const urlParts = fileUrl.split('.amazonaws.com/');
    if (urlParts.length < 2) return;
    
    const fileKey = urlParts[1];
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey
    });

    await s3Client.send(command);
    console.log('✅ Eliminado de S3:', fileKey);
    
  } catch (error) {
    console.error('❌ Error eliminando de S3:', error);
  }
};

module.exports = {
  uploadImageToS3,
  deleteFromS3
};