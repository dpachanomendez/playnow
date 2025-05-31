import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function ReservaForm() {
  const [formData, setFormData] = useState({
    fecha: "",
    horario: "",
    cancha: "",
    metodoPago: "efectivo", // opciones: efectivo, mercadopago
    nombre: "",
    email: "",
    telefono: ""
  });

  const [mensaje, setMensaje] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preferenceId, setPreferenceId] = useState(null);
  const navigate = useNavigate();
  const mpRef = useRef(null);

  const horasDisponibles = [
    "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
    "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00",
    "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00",
    "20:00-21:00", "21:00-22:00"
  ];

  // Carga dinámica SDK Mercado Pago
  useEffect(() => {
    if (formData.metodoPago === "mercadopago" && !window.MercadoPago) {
      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      script.onload = () => {
        console.log("SDK Mercado Pago cargado");
      };
      document.body.appendChild(script);
    }
  }, [formData.metodoPago]);

  // Renderizar brick Mercado Pago cuando tengamos preferenceId y SDK cargado
  useEffect(() => {
    if (formData.metodoPago === "mercadopago" && preferenceId && window.MercadoPago) {
      const mp = new window.MercadoPago("TEST-cd4c4aaf-9b03-4d30-a65a-73b4fdf89124", { locale: "es" }); // Cambia por tu public key real

      const bricksBuilder = mp.bricks();

      const settings = {
        initialization: {
          amount: 5000, // Puedes ajustar dinámicamente según la reserva si quieres
          preferenceId: preferenceId,
          payer: {
            firstName: formData.nombre,
            lastName: "",
            email: formData.email,
          },
        },
        customization: {
          visual: {
            style: { theme: "default" }
          },
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            ticket: "all",
            bankTransfer: "all",
            atm: "all",
            onboarding_credits: "all",
            wallet_purchase: "all",
            maxInstallments: 4,
          },
        },
        callbacks: {
          onReady: () => {
            console.log("Payment Brick listo");
          },
          onSubmit: ({ selectedPaymentMethod, formData: paymentFormData }) => {
            return new Promise((resolve, reject) => {
              // Envía los datos de pago a backend para procesar
              fetch("http://localhost:4000/api/payments/process_payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paymentFormData),
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.success) {
                    setMensaje("✅ Pago realizado y reserva confirmada!");
                    // Limpiar formulario
                    setFormData({
                      fecha: "",
                      horario: "",
                      cancha: "",
                      metodoPago: "efectivo",
                      nombre: "",
                      email: "",
                      telefono: ""
                    });
                    setPreferenceId(null);
                    setIsSubmitting(false);
                    resolve();
                    setTimeout(() => navigate('/mis-reservas'), 2000);
                  } else {
                    setMensaje("❌ Error en el pago: " + (data.message || "Intente de nuevo"));
                    reject();
                  }
                })
                .catch((err) => {
                  console.error(err);
                  setMensaje("❌ Error procesando el pago");
                  reject();
                });
            });
          },
          onError: (error) => {
            console.error("Error Brick:", error);
            setMensaje("❌ Error en el widget de pago. Intente más tarde.");
          },
        },
      };

      if (mpRef.current) {
        bricksBuilder.create("payment", mpRef.current, settings);
      }
    }
  }, [preferenceId, formData, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!formData.nombre || !formData.email || !formData.fecha || !formData.horario || !formData.cancha) {
      setMensaje("❌ Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      const fechaReserva = new Date(formData.fecha);
      if (isNaN(fechaReserva.getTime())) throw new Error("Fecha inválida");

      setIsSubmitting(true);

      // Si el método es efectivo, solo envía reserva como antes
      if (formData.metodoPago === "efectivo") {
        const token = localStorage.getItem('token');
        const endpoint = token ? '/api/reservas' : '/api/reservas/invitado';

        const reservaData = { ...formData, fecha: fechaReserva };

        const response = await fetch(`http://localhost:4000${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(reservaData)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Error al crear la reserva");
        }

        setMensaje("✅ Reserva creada exitosamente!");
        setFormData({
          fecha: "",
          horario: "",
          cancha: "",
          metodoPago: "efectivo",
          nombre: "",
          email: "",
          telefono: ""
        });

        setTimeout(() => navigate('/mis-reservas'), 2000);
        setIsSubmitting(false);

      } else if (formData.metodoPago === "mercadopago") {
        // Crear la preferencia de pago en backend
        const preferenceResponse = await fetch("/api/payments/create_preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            fecha: fechaReserva,
          }),
        });

        const preferenceData = await preferenceResponse.json();

        if (!preferenceResponse.ok) {
          throw new Error(preferenceData.message || "Error creando preferencia de pago");
        }

        setPreferenceId(preferenceData.preferenceId);
        // El brick se renderizará automáticamente por el useEffect que escucha preferenceId
      }
    } catch (error) {
      console.error("[ERROR] Detalles:", error);
      setMensaje(error.message || "❌ Error al procesar la reserva. Intenta nuevamente.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md space-y-4 text-black">
      <h2 className="text-xl font-bold">Reservar Cancha</h2>

      {!preferenceId ? (
        <form onSubmit={handleSubmit}>

          <div>
            <label className="block mb-1">Nombre completo *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full border p-2 rounded text-black"
              required
            />
          </div>

          <div>
            <label className="block mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border p-2 rounded text-black"
              required
            />
          </div>

          <div>
            <label className="block mb-1">Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full border p-2 rounded text-black"
            />
          </div>

          <div>
            <label className="block mb-1">Fecha *</label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              className="w-full border p-2 rounded text-black"
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block mb-1">Horario *</label>
            <select
              name="horario"
              value={formData.horario}
              onChange={handleChange}
              className="w-full border p-2 rounded text-black"
              required
            >
              <option value="">Selecciona un horario</option>
              {horasDisponibles.map((hora) => (
                <option key={hora} value={hora}>{hora}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1">Cancha *</label>
            <select
              name="cancha"
              value={formData.cancha}
              onChange={handleChange}
              className="w-full border p-2 rounded text-black"
              required
            >
              <option value="">Selecciona una cancha</option>
              <option value="Fútbol 1">Fútbol 1</option>
              <option value="Fútbol 2">Fútbol 2</option>
              <option value="Fútbol 3">Fútbol 3</option>
            </select>
          </div>

          <div>
            <label className="block mb-1">Método de pago *</label>
            <select
              name="metodoPago"
              value={formData.metodoPago}
              onChange={handleChange}
              className="w-full border p-2 rounded text-black"
              required
            >
              <option value="efectivo">Pago en efectivo</option>
              <option value="mercadopago">Mercado Pago</option>
            </select>
          </div>

          <button
            type="submit"
            className="mt-4 w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Procesando..." : "Reservar"}
          </button>

          {mensaje && <p className="mt-3 text-center">{mensaje}</p>}
        </form>
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-2">Complete el pago con Mercado Pago</h3>
          <div ref={mpRef} id="mercadopago-brick-container" />
          {mensaje && <p className="mt-3 text-center">{mensaje}</p>}
        </div>
      )}
    </div>
  );
}
