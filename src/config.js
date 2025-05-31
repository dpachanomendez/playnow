// src/config.js
export const PORT = process.env.PORT || 4000;
export const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/playnow";
export const TOKEN_SECRET = process.env.TOKEN_SECRET || "secret";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Agrega esta línea para Mercado Pago
export const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "TU_ACCESS_TOKEN_AQUI";
