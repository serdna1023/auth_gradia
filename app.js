// app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// ⚠️ Asegúrate que este repo exista y exporte la clase correctamente
const { AuthRepositorySequelize } = require('./src/mantenimiento_usuarios/repositories/implementations/AuthRepositorySequelize');
const { buildAuthRouter } = require('./src/mantenimiento_usuarios/routes/auth.routes');

const app = express();

/* ======= Middlewares globales (orden recomendado) ======= */
app.use(cors());
app.use(express.json());                          // parse JSON
app.use(express.urlencoded({ extended: true }));  // parse x-www-form-urlencoded (opcional)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* ======= Inyección de dependencias ======= */
const repos = { AuthRepository: new AuthRepositorySequelize() };

/* ======= Rutas ======= */
app.get('/', (_req, res) => res.json({ message: 'API funcionando 🚀' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', buildAuthRouter({ repos }));  // <- usa express.Router() adentro

/* ======= 404 ======= */
app.use((req, res, _next) => {
  res.status(404).json({ message: `No encontrado: ${req.method} ${req.originalUrl}` });
});

/* ======= Manejo centralizado de errores ======= */
app.use((err, _req, res, _next) => {
  // Errores de body parser
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido' });
  }

  // Puedes especializar por Sequelize, JWT, etc.
  const status = err.status || err.statusCode || 500;
  const msg = err.message || 'Error interno del servidor';
  res.status(status).json({ message: msg });
});

module.exports = app;
