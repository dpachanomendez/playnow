import express from 'express';
import { crearReserva, crearReservaInvitado, validarReserva } from '../controllers/reserva.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Ruta protegida para usuarios autenticados con validación previa de datos
router.post('/', auth, validarReserva, crearReserva);

// Ruta pública para invitados con validación previa de datos
router.post('/invitado', validarReserva, crearReservaInvitado);

export default router;
