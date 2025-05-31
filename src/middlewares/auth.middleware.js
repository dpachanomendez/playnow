// src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../config.js';

export const auth = (req, res, next) => {
  // Excepción para rutas de reservas que pueden aceptar invitados
  if (req.path === '/api/reservas' && req.method === 'POST') {
    // Verificar si hay token (usuario autenticado)
    const authHeader = req.headers.authorization;
    const token = req.cookies?.token || 
                 (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || 
                 req.query.token;

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
        // Continuamos sin autenticación (reserva como invitado)
      }
    }
    return next(); // Permitir continuar con o sin autenticación
  }

  // Resto del middleware original para otras rutas...
  try {
    const authHeader = req.headers.authorization;
    const token = req.cookies?.token || 
                 (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || 
                 req.query.token;

    if (!token) {
      console.warn('Intento de acceso sin token', {
        ip: req.ip,
        method: req.method,
        path: req.path
      });
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación no proporcionado',
        errorCode: 'AUTH_TOKEN_REQUIRED'
      });
    }

    const decoded = jwt.verify(token, TOKEN_SECRET, {
      algorithms: ['HS256'],
      ignoreExpiration: false
    });

    if (!decoded.userId) {
      throw new jwt.JsonWebTokenError('Token inválido: falta userId');
    }

    req.auth = {
      userId: decoded.userId,
      sessionId: decoded.sessionId || null,
      issuedAt: new Date(decoded.iat * 1000),
      expiresAt: new Date(decoded.exp * 1000),
      ...(decoded.role && { role: decoded.role })
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]', error.message);
    
    let message = 'Error de autenticación';
    if (error.name === 'TokenExpiredError') {
      message = 'Token expirado';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Token inválido';
    }

    res.status(401).json({
      success: false,
      message: message,
      errorCode: 'AUTH_ERROR'
    });
  }
};

// ✅ Agregado para permitir su importación explícita:
export const verifyToken = auth;
