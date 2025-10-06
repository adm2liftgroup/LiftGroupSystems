const { Pool } = require("pg");
require("dotenv").config();

// Configuración para desarrollo vs producción
const config = process.env.DATABASE_URL 
  ? {
      // PRODUCCIÓN (Render)
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      // DESARROLLO (Local)
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    };

const pool = new Pool(config);

// Manejar eventos de conexión
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL - Ambiente:', process.env.NODE_ENV);
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en la BD:', err);
});

// Verificar conexión al iniciar
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('🎯 Conexión a BD exitosa');
    client.release();
  } catch (error) {
    console.error('💥 Error conectando a BD:', error.message);
  }
};

testConnection();

module.exports = pool;