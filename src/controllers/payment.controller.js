import { MercadoPagoConfig, Preference } from "mercadopago";
import { MP_ACCESS_TOKEN } from "../config.js";

const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
const preference = new Preference(mpClient);

export const createPreference = async (req, res) => {
  try {
    const { nombre, email, fecha, horario, cancha } = req.body;

    const preferenceRequest = {
      items: [
        {
          title: `Reserva cancha ${cancha}`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: 5000, // Puedes ajustar este valor dinámicamente
        },
      ],
      payer: {
        name: nombre,
        email: email,
      },
      back_urls: {
        success: "http://localhost:5173/pago-exitoso",
        failure: "http://localhost:5173/pago-fallido",
        pending: "http://localhost:5173/pago-pendiente",
      },
      auto_return: "approved",
    };

    const response = await preference.create(preferenceRequest);

    res.json({ preferenceId: response.body.id });
  } catch (error) {
    console.error("Error creando preferencia MercadoPago:", error);
    res.status(500).json({ message: "Error creando preferencia de pago" });
  }
};
