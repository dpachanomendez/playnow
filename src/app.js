import "dotenv/config"; // Make sure this is at the very top
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import taksRoutes from "./routes/tasks.routes.js";
import reservasRoutes from "./routes/reserva.routes.js";
// import paymentRoutes from "./routes/payment.routes.js"; // <--- Importación ruta pagos (REMOVED)
import paypalRoutes from "./routes/paypal.routes.js"; // Import PayPal routes

import { FRONTEND_URL } from "./config.js";
import { connectDB } from "./db.js"; // ✅ conexión a MongoDB

const app = express();

// Conexión a la base de datos al iniciar
connectDB().catch(err => {
  console.error("Error fatal al conectar a MongoDB:", err);
  process.exit(1);
});

// Configuración de middlewares
app.use(
  cors({
    credentials: true,
    origin: FRONTEND_URL,
  })
);

app.use(express.json()); // Para el resto de rutas POST/PUT JSON
app.use(morgan("dev"));
app.use(cookieParser());

// Validaciones previas para reservas
app.use("/api/reservas", (req, res, next) => {
  if (req.body.fecha) {
    const fecha = new Date(req.body.fecha);
    if (isNaN(fecha.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido'
      });
    }
    req.body.fecha = fecha;
  }

  if (req.body.horario && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.horario)) {
    return res.status(400).json({
      success: false,
      message: 'Formato de horario inválido. Use HH:MM-HH:MM'
    });
  }

  if (req.path === '/invitado' && (!req.body.nombre || !req.body.email)) {
    return res.status(400).json({
      success: false,
      message: 'Nombre y email son requeridos para reservas de invitados'
    });
  }

  next();
});

// Rutas de la aplicación
app.use("/api/auth", authRoutes);
app.use("/api", taksRoutes); // General tasks routes
app.use("/api/reservas", reservasRoutes);
// app.use("/api/payments", paymentRoutes); // <--- Ruta pagos Mercado Pago (REMOVED)
app.use("/api", paypalRoutes); // Register PayPal routes under /api

// Middleware de errores
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.errors
    });
  }

  if (err.message.includes('Reserva') || err.message.includes('Cancha')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// Configuración para producción
if (process.env.NODE_ENV === "production") {
  const path = await import("path");
  app.use(express.static("client/dist"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve("client", "dist", "index.html"));
  });
}

export default app;
