// app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { buildAuthRouter } = require("./src/mantenimiento_usuarios/routes/auth.routes");

function createApp({ repos }) {
  const app = express();

  const IS_PRODUCTION = process.env.NODE_ENV === "production";

  // -----------------------------
  // 🔥 CORS FINAL (LOCAL + PROD)
  // -----------------------------
  const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL,   // Producción (Vercel)
    "http://localhost:3000",    // Dev local
    "http://127.0.0.1:3000",    // Alternativa local
  ];

  const corsOptions = {
    origin: (origin, callback) => {
      // Permitir herramientas como Postman (que no envían Origin)
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ ORIGEN BLOQUEADO POR CORS:", origin);
      return callback(new Error("CORS_NOT_ALLOWED"), false);
    },

    credentials: true, // 🔥 Necesario para enviar cookies httpOnly
  };

  // Middlewares
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    morgan(IS_PRODUCTION ? "combined" : "dev")
  );

  // Rutas simples
  app.get("/", (_req, res) =>
    res.json({ message: "API funcionando 🚀" })
  );

  app.get("/health", (_req, res) =>
    res.json({ status: "ok" })
  );

  // Auth routes
  app.use("/api/auth", buildAuthRouter({ repos }));

  // 404 handler
  app.use((req, res, _next) => {
    res
      .status(404)
      .json({ message: `No encontrado: ${req.method} ${req.originalUrl}` });
  });

  // Manejo de errores
  app.use((err, _req, res, _next) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ message: "JSON inválido" });
    }
    const status = err.status || 500;
    const msg = err.message || "Error interno del servidor";
    res.status(status).json({ message: msg });
  });

  return app;
}

module.exports = { createApp };
