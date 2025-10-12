// server.js
const app = require('./app');

// Si tu módulo de DB exporta instancia de sequelize:
let sequelize;
try {
  // Ajusta según tu archivo real:
  ({ sequelize } = require('./src/config/database'));
} catch (_) {
  // Si tu archivo de DB solo “arranca” la conexión al requerirlo,
  // puedes ignorar este bloque y dejar que haga side-effects.
}

const PORT = process.env.PORT || 8080;

async function start() {
  try {
    // Si tienes sequelize, valida conexión aquí
    if (sequelize?.authenticate) {
      await sequelize.authenticate();
      // await sequelize.sync(); // si quieres sincronizar modelos
      console.log('✓ Conexión establecida con la base de datos');
    }

    app.listen(PORT, () => {
      console.log(`# Server escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error al iniciar la app:', err);
    process.exit(1);
  }
}

start();
