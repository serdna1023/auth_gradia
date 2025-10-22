require('dotenv').config();

// --- Importaciones ---
const { createApp } = require('./app');
const sequelize = require('./src/config/database');
const { AuthRepositorySequelize } = require('./src/mantenimiento_usuarios/repositories/implementations/AuthRepositorySequelize');

// --- Inyección de Dependencias (El "Composition Root") ---
// 1. Creamos las instancias concretas de nuestros repositorios
const repos = {
  AuthRepository: new AuthRepositorySequelize()
};

// 2. Creamos la aplicación Express pasándole las dependencias
const app = createApp({ repos });

// --- Arranque del Servidor ---
const PORT = process.env.PORT || 8080;

async function start() {
  try {
    // Validamos la conexión a la base de datos
    await sequelize.authenticate();
    console.log('✓ Conexión establecida con la base de datos');

    // Iniciamos el servidor
    app.listen(PORT, () => {
      console.log(`# Server escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error al iniciar la app:', err);
    process.exit(1);
  }
}

start();