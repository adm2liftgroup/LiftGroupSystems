const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

// Inicialización
const app = express();

// Seguridad
app.use(helmet());

// Body parser + cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS TEMPORAL - Permitir todo mientras desarrollas
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      "http://localhost:3000",
      "http://192.168.0.193:3000",
      "https://liftgroup-frontend.onrender.com"
    ]
  : [
      "http://localhost:3000",             
      "http://192.168.0.193:3000"          
    ];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS bloqueado para origen:', origin);
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true,
}));

// SERVIR ARCHIVOS ESTÁTICOS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 100 
});
app.use(limiter);

// Ruta de salud mejorada
app.get("/api/health", (req, res) => {
  res.json({ 
    message: "🚀 Backend LiftGroup funcionando SOLO con DB",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    status: "backend-only"
  });
});

// Ruta para probar conexión a BD
app.get("/api/test-db", async (req, res) => {
  try {
    const pool = require("./db");
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    res.json({
      message: "✅ Conexión a BD exitosa",
      environment: process.env.NODE_ENV,
      database: {
        timestamp: result.rows[0].current_time,
        postgres_version: result.rows[0].postgres_version,
        tables: tables.rows.map(t => t.table_name)
      }
    });
  } catch (error) {
    console.error('Error BD:', error);
    res.status(500).json({ 
      error: 'Error de conexión a BD',
      details: process.env.NODE_ENV === 'production' ? 'Revisa logs' : error.message
    });
  }
});

// Ruta para verificar datos específicos
app.get("/api/check-data", async (req, res) => {
  try {
    const pool = require("./db");
    
    const montacargasCount = await pool.query('SELECT COUNT(*) FROM public."Montacargas"');
    const usuariosCount = await pool.query('SELECT COUNT(*) FROM public."Usuarios"');
    const mantenimientosCount = await pool.query('SELECT COUNT(*) FROM public.mantenimientos_programados');
    const observacionesCount = await pool.query('SELECT COUNT(*) FROM public.observaciones_mantenimiento');
    
    res.json({
      message: "📊 Datos en la base de datos",
      tables: {
        Montacargas: parseInt(montacargasCount.rows[0].count),
        Usuarios: parseInt(usuariosCount.rows[0].count),
        mantenimientos_programados: parseInt(mantenimientosCount.rows[0].count),
        observaciones_mantenimiento: parseInt(observacionesCount.rows[0].count)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tus rutas existentes
const authRoutes = require("./routes/auth");
const montacargasRoutes = require("./routes/montacargas");
const mantenimientosRoutes = require("./routes/mantenimientos");
const refaccionesRoutes = require('./routes/refacciones');

app.use("/auth", authRoutes);
app.use("/api/montacargas", montacargasRoutes);
app.use("/api/mantenimientos", mantenimientosRoutes);
app.use('/api/refacciones', refaccionesRoutes);

// Ruta de bienvenida
app.get("/", (req, res) => {
  res.json({
    message: "Bienvenido al Backend de LiftGroup",
    status: "Solo base de datos configurada",
    endpoints: {
      health: "/api/health",
      test_db: "/api/test-db", 
      check_data: "/api/check-data",
      auth: "/auth/*",
      montacargas: "/api/montacargas/*",
      mantenimientos: "/api/mantenimientos/*",
      refacciones: "/api/refacciones/*"
    }
  });
});

// Manejar rutas no encontradas (CORREGIDO)
app.use((req, res) => {
  res.status(404).json({ 
    error: "Ruta no encontrada",
    path: req.originalUrl,
    available_routes: [
      "GET /",
      "GET /api/health", 
      "GET /api/test-db",
      "GET /api/check-data"
    ]
  });
});

// Manejo centralizado de errores
app.use((error, req, res, next) => {
  console.error('Error del servidor:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV !== 'production' && { details: error.message })
  });
});

// Arrancar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🎯 Backend LiftGroup ejecutándose en puerto ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Base de datos: ${process.env.NODE_ENV === 'production' ? 'Render PostgreSQL' : 'Local'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});