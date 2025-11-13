require('dotenv').config();
const { uploadImageToS3 } = require('./aws-s3');

async function testUpload() {
    try {
        console.log('🧪 Probando subida a S3...');
        
        // Crear una imagen de prueba mínima
        const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        
        const result = await uploadImageToS3(
            testImage,
            'test-image.png',
            'image/png'
        );
        
        console.log('✅ ¡SUBIDA EXITOSA!');
        console.log('📁 URL:', result);
        
        // Probar que se puede acceder
        const response = await fetch(result);
        if (response.ok) {
            console.log('✅ ¡ARCHIVO ACCESIBLE PÚBLICAMENTE!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testUpload();
