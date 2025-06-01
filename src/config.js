// src/config.js
export const PORT = process.env.PORT || 4000;
export const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/playnow";
export const TOKEN_SECRET = process.env.TOKEN_SECRET || "secret";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Mercado Pago Access Token Removed
// export const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "TEST-7983049517288918-052519-0380412a8b70ba1a16657313c0469e2a-326174938";
