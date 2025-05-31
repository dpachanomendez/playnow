import mongoose from 'mongoose';

const reservaSchema = new mongoose.Schema({
  cancha: { type: String, required: true },
  fecha: { type: Date, required: true },
  horario: { type: String, required: true },
  metodoPago: { type: String, required: true },
  tipo: { type: String, enum: ['usuario', 'invitado'], required: true },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  datosInvitado: {
    nombre: { type: String },
    email: { type: String },
    telefono: { type: String }
  },
  estado: { type: String, default: 'pendiente' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Reserva', reservaSchema);