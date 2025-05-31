import Reserva from '../models/reserva.model.js';

// Mapeo de nombres de cancha a IDs para calcular precio
const preciosCanchas = {
  'Fútbol 1': 50,
  'Fútbol 2': 70,
  'Tenis 1': 100
};

// Función auxiliar mejorada para calcular precio
const calcularPrecio = (nombreCancha) => {
  return preciosCanchas[nombreCancha] || 0;
};

// Middleware para validar reserva
const validarReserva = async (req, res, next) => {
  try {
    if (!req.body.fecha || !req.body.horario || !req.body.cancha) {
      return res.status(400).json({
        success: false,
        message: 'Fecha, horario y cancha son requeridos'
      });
    }

    const fechaReserva = new Date(req.body.fecha);
    if (isNaN(fechaReserva.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha inválida'
      });
    }

    req.fechaReserva = fechaReserva;
    next();
  } catch (error) {
    console.error('Error en validarReserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar los datos de reserva'
    });
  }
};

export const crearReserva = async (req, res) => {
  try {
    // Verificar disponibilidad
    const reservaExistente = await Reserva.findOne({
      cancha: req.body.cancha,
      fecha: req.fechaReserva,
      horario: req.body.horario,
      estado: { $ne: 'cancelada' } // Ignorar reservas canceladas
    });

    if (reservaExistente) {
      return res.status(400).json({ 
        success: false,
        message: `La cancha ${req.body.cancha} ya está reservada para el ${req.fechaReserva.toLocaleDateString()} a las ${req.body.horario}` 
      });
    }

    // Crear nueva reserva
    const nuevaReserva = new Reserva({
      ...req.body,
      fecha: req.fechaReserva,
      usuario: req.auth.userId,
      tipo: 'usuario',
      estado: 'pendiente'
    });

    await nuevaReserva.save();

    return res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: {
        id: nuevaReserva._id,
        cancha: nuevaReserva.cancha,
        fecha: nuevaReserva.fecha,
        horario: nuevaReserva.horario,
        estado: nuevaReserva.estado
      }
    });

  } catch (error) {
    console.error('Error en crearReserva:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al crear la reserva'
    });
  }
};

export const crearReservaInvitado = async (req, res) => {
  try {
    // Validación de datos del invitado
    if (!req.body.nombre || !req.body.email) {
      return res.status(400).json({ 
        success: false,
        message: 'Nombre y email son requeridos para reservas de invitados' 
      });
    }

    // Verificar disponibilidad
    const reservaExistente = await Reserva.findOne({
      cancha: req.body.cancha,
      fecha: req.fechaReserva,
      horario: req.body.horario,
      estado: { $ne: 'cancelada' }
    });

    if (reservaExistente) {
      return res.status(400).json({ 
        success: false,
        message: `La cancha ${req.body.cancha} ya está reservada para el ${req.fechaReserva.toLocaleDateString()} a las ${req.body.horario}`
      });
    }

    // Crear reserva de invitado
    const nuevaReserva = new Reserva({
      cancha: req.body.cancha,
      fecha: req.fechaReserva,
      horario: req.body.horario,
      metodoPago: req.body.metodoPago,
      tipo: 'invitado',
      estado: 'pendiente',
      datosInvitado: {
        nombre: req.body.nombre,
        email: req.body.email,
        telefono: req.body.telefono || null
      }
    });

    await nuevaReserva.save();

    // Respuesta sin Mercado Pago (temporalmente comentado)
    return res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: {
        id: nuevaReserva._id,
        cancha: nuevaReserva.cancha,
        fecha: nuevaReserva.fecha,
        horario: nuevaReserva.horario,
        nombre: nuevaReserva.datosInvitado.nombre,
        estado: nuevaReserva.estado
      }
      // payment_url: null // Puedes agregar esto si lo necesitas
    });

    /*
    // Código de Mercado Pago (comentado temporalmente)
    const mpResponse = await fetch('http://localhost:4000/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cancha: nuevaReserva.cancha,
        precio: calcularPrecio(nuevaReserva.cancha),
        reservaId: nuevaReserva._id.toString()
      })
    });

    if (!mpResponse.ok) {
      throw new Error('Error al conectar con Mercado Pago');
    }

    const { payment_url } = await mpResponse.json();

    return res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: {
        id: nuevaReserva._id,
        cancha: nuevaReserva.cancha,
        fecha: nuevaReserva.fecha,
        horario: nuevaReserva.horario,
        nombre: nuevaReserva.datosInvitado.nombre
      },
      payment_url
    });
    */

  } catch (error) {
    console.error('Error en crearReservaInvitado:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al crear la reserva'
    });
  }
};

// Exportar el middleware de validación
export { validarReserva };