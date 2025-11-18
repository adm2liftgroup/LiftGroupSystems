const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// Subir imagen a S3
const uploadImageToS3 = async (fileBuffer, fileName, mimetype) => {
  try {
    console.log(`📤 Subiendo imagen a AWS S3: ${fileName}`);
    
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `refacciones-images/${Date.now()}-${cleanFileName}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: fileBuffer,
      ContentType: mimetype,
      ACL: 'public-read'  // 👈 ESTA LÍNEA ES CRÍTICA
    });

    await s3Client.send(command);

    const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`;
    
    console.log('✅ Imagen subida a S3:', imageUrl);
    return imageUrl;
    
  } catch (error) {
    console.error('❌ Error subiendo imagen a S3:', error);
    throw error;
  }
};

// Subir documento a S3 (PDF, DOC, etc.)
const uploadDocumentToS3 = async (fileBuffer, fileName, mimetype) => {
  try {
    console.log(`📤 Subiendo documento a AWS S3: ${fileName}`);
    
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `montacargas-documents/${Date.now()}-${cleanFileName}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: fileBuffer,
      ContentType: mimetype,
      ACL: 'public-read'  // 👈 ESTA LÍNEA ES CRÍTICA
    });

    await s3Client.send(command);

    const documentUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`;
    
    console.log('✅ Documento subido a S3:', documentUrl);
    return documentUrl;
    
  } catch (error) {
    console.error('❌ Error subiendo documento a S3:', error);
    throw error;
  }
};

// Eliminar archivo de S3
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
  uploadDocumentToS3,
  deleteFromS3
};