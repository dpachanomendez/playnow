import { MercadoPagoConfig, Preference, Payment as ActualPayment } from "mercadopago";
import { MP_ACCESS_TOKEN } from "../config.js";

const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
let PaymentClass = ActualPayment; // Use actual by default

// Function to allow tests to inject a mock
export const __setPaymentClassForTesting = (MockPayment) => {
  PaymentClass = MockPayment;
};

const preference = new Preference(mpClient); // Preference might also need PaymentClass if it uses it. Assuming it doesn't for now.

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

    // If Preference internally uses Payment, it might also need the injected PaymentClass
    // For now, assuming Preference works independently or with ActualPayment
    const response = await preference.create(preferenceRequest);

    res.json({ preferenceId: response.body.id });
  } catch (error) {
    console.error("Error creando preferencia MercadoPago:", error);
    res.status(500).json({ message: "Error creando preferencia de pago" });
  }
};

export const processPayment = async (req, res) => {
  try {
    // Use the (potentially mocked) PaymentClass
    const payment = new PaymentClass(mpClient);
    const response = await payment.create({ body: req.body });

    console.log("Payment creation result:", response);

    res.json({ success: true, data: response });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Optional: Add a reset function if you want to ensure tests don't interfere
export const __resetPaymentClassForTesting = () => {
  PaymentClass = ActualPayment;
};
