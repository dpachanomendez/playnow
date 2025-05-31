import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../config.js';

export const validarReserva = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = req.cookies?.token || 
               (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

  if (token) {
    try {
      const decoded = jwt.verify(token, TOKEN_SECRET, {
        algorithms: ['HS256'],
        ignoreExpiration: false
      });

      req.auth = {
        userId: decoded.userId,
        ...(decoded.role && { role: decoded.role })
      };
    } catch (error) {
      console.warn('Token inválido para reserva', error.message);
    }
  }

  if (!req.auth && (!req.body.email || !req.body.nombre)) {
    return res.status(400).json({
      success: false,
      message: 'Para reservar como invitado debe proporcionar nombre y email',
      errorCode: 'GUEST_RESERVATION_REQUIREMENTS'
    });
  }

  next();
};
