const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
// const cookieParser = require('cookie-parser'); // Descomenta cuando lo uses
const { buildAuthRouter } = require('./src/mantenimiento_usuarios/routes/auth.routes');

function createApp({ repos }) {
  const app = express();

  /* ======= Middlewares globales ======= */
  app.use(cors(/* Opciones de CORS aquí si las necesitas */));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // app.use(cookieParser()); // Descomenta cuando lo uses
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  /* ======= Rutas ======= */
  app.get('/', (_req, res) => res.json({ message: 'API funcionando 🚀' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // La fábrica usa los 'repos' que le pasaron para construir el router
  app.use('/api/auth', buildAuthRouter({ repos }));

  /* ======= 404 Handler ======= */
  app.use((req, res, _next) => {
    res.status(404).json({ message: `No encontrado: ${req.method} ${req.originalUrl}` });
  });

  /* ======= Manejo centralizado de errores ======= */
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'JSON inválido' });
    }
    const status = err.status || 500;
    const msg = err.message || 'Error interno del servidor';
    res.status(status).json({ message: msg });
  });

  return app;
}

module.exports = { createApp };