import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ReservaForm() {
  const [formData, setFormData] = useState({
    fecha: "",
    horario: "",
    cancha: "",
    metodoPago: "efectivo",
    nombre: "",
    email: "",
    telefono: ""
  });

  const [mensaje, setMensaje] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Used for both efectivo and PayPal states
  const navigate = useNavigate();

  const horasDisponibles = [
    "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
    "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00",
    "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00",
    "20:00-21:00", "21:00-22:00"
  ];

  // Helper function to display messages related to PayPal flow
  function resultMessage(message, isError = false) {
    const container = document.querySelector("#result-message");
    if (container) {
      container.innerHTML = message;
      container.className = isError ? "mt-2 text-center text-red-500" : "mt-2 text-center text-green-500";
      setTimeout(() => {
        if (container.innerHTML === message) {
          container.innerHTML = "";
          container.className = "mt-2 text-center";
        }
      }, 7000); // Increased timeout for messages
    } else {
      setMensaje(message); // Fallback for general messages
    }
  }

  // PayPal Buttons Rendering Effect
  useEffect(() => {
    const paypalButtonContainer = document.getElementById("paypal-button-container");
    const resultMsgContainer = document.getElementById("result-message");

    if (formData.metodoPago === 'paypal') {
      // Ensure form fields are pre-filled before allowing PayPal payment attempt
      if (!formData.nombre || !formData.email || !formData.fecha || !formData.horario || !formData.cancha) {
        resultMessage("Por favor, complete todos los campos del formulario antes de proceder con PayPal.", true);
        if (paypalButtonContainer) paypalButtonContainer.innerHTML = ""; // Clear any existing buttons
        return;
      }

      if (window.paypal && paypalButtonContainer) {
        paypalButtonContainer.innerHTML = ""; // Clear previous buttons
        setIsSubmitting(false); // Ensure isSubmitting is false before rendering buttons

        window.paypal.Buttons({
          style: { shape: "rect", layout: "vertical", color: "gold", label: "paypal" },
          async createOrder(data, actions) {
            // Validate form data before creating order
            if (!formData.nombre || !formData.email || !formData.fecha || !formData.horario || !formData.cancha) {
              resultMessage("❌ Faltan datos en el formulario para crear la orden.", true);
              return Promise.reject(new Error("Missing form data"));
            }
            resultMessage('Iniciando pago con PayPal...');
            setIsSubmitting(true);
            try {
              const orderDataPayload = {
                cart: [{
                  id: `RESERVA_${formData.cancha}_${formData.fecha}_${formData.horario}`,
                  quantity: "1",
                  description: `Reserva Cancha: ${formData.cancha} - Fecha: ${formData.fecha} ${formData.horario} (Jugador: ${formData.nombre})`,
                  // Amount is hardcoded here (USD) as per backend example.
                  // In a real app, this should be dynamic and verified server-side.
                  amount_value: "50.00", // Example: fixed price for a reservation in USD
                }],
                // Pass user details if your backend needs them for creating the order context
                payer_info: {
                  email: formData.email,
                  name: formData.nombre,
                  phone: formData.telefono
                }
              };
              const response = await fetch("http://localhost:4000/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderDataPayload),
              });
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Error del servidor al crear orden." }));
                throw new Error(errorData.message || `HTTP error ${response.status}`);
              }
              const orderData = await response.json();
              if (orderData.orderID) {
                resultMessage(`Orden ${orderData.orderID} creada. Complete el pago.`);
                return orderData.orderID;
              } else {
                throw new Error("No se pudo obtener el ID de la orden de PayPal.");
              }
            } catch (error) {
              console.error("Error en createOrder:", error);
              resultMessage(`Error al crear la orden: ${error.message}`, true);
              setIsSubmitting(false);
              throw error;
            }
          },
          async onApprove(data, actions) {
            resultMessage(`Procesando pago para orden ${data.orderID}...`);
            setIsSubmitting(true); // Keep submitting state
            try {
              const response = await fetch(`http://localhost:4000/api/orders/${data.orderID}/capture`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              });
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Error del servidor al capturar pago." }));
                throw new Error(errorData.message || `HTTP error ${response.status}`);
              }
              const orderData = await response.json();
              const errorDetail = orderData?.details?.[0];
              if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                resultMessage("Pago declinado. Intente con otro método.", true);
                setIsSubmitting(false); // Allow re-attempt or method change
                return actions.restart();
              } else if (errorDetail) {
                throw new Error(`${errorDetail.description} (${orderData.debug_id || ''})`);
              } else if (orderData.status !== 'COMPLETED') {
                throw new Error("La captura del pago no se completó exitosamente.");
              }

              resultMessage(`✅ Pago completado! ID Transacción: ${orderData.id}.`);
              setMensaje("✅ Pago con PayPal y reserva confirmada!");

              // TODO: Here you would typically make another fetch call to your backend
              // to save the reservation details along with PayPal transaction ID (orderData.id)
              // For example: await saveReservationToDB({ ...formData, paymentId: orderData.id, paymentStatus: 'COMPLETED' });

              setFormData({
                fecha: "", horario: "", cancha: "", metodoPago: "efectivo",
                nombre: "", email: "", telefono: ""
              });
              setTimeout(() => {
                navigate('/mis-reservas'); // Or a dedicated success page
                setIsSubmitting(false); // Reset after navigation
              }, 3000);
            } catch (error) {
              console.error("Error en onApprove:", error);
              resultMessage(`Error al capturar el pago: ${error.message}`, true);
              setIsSubmitting(false);
            }
          },
          onError(err) {
            console.error("Error en botones PayPal (onError callback):", err);
            resultMessage(`Error con PayPal: ${err.message}. Intente de nuevo o elija otro método.`, true);
            setIsSubmitting(false);
          }
        }).render("#paypal-button-container").catch(err => {
            console.error("Error renderizando botones PayPal:", err);
            resultMessage("Error al mostrar botones de PayPal. Verifique la configuración o refresque.", true);
            setIsSubmitting(false);
        });
      } else if (!window.paypal && paypalButtonContainer) {
          resultMessage("SDK de PayPal no está listo. Si el problema persiste, refresque la página.", true);
          paypalButtonContainer.innerHTML = "<p class='text-red-500'>Cargando PayPal...</p>";
      }
      return () => { // Cleanup function
        if (paypalButtonContainer) paypalButtonContainer.innerHTML = "";
        if (resultMsgContainer) resultMsgContainer.innerHTML = "";
      };
    } else { // If metodoPago is not 'paypal', ensure PayPal UI is cleared
        if (paypalButtonContainer) paypalButtonContainer.innerHTML = "";
        if (resultMsgContainer) resultMsgContainer.innerHTML = "";
        if(isSubmitting && formData.metodoPago !== 'efectivo') setIsSubmitting(false); // Reset if switching away from PayPal during its load
    }
  // Key dependencies for re-rendering PayPal buttons or clearing them.
  // formData itself is not added to prevent re-renders on every keystroke if form fields are typed while paypal is selected.
  // createOrder accesses formData directly when called.
  }, [formData.metodoPago, formData.nombre, formData.email, formData.fecha, formData.horario, formData.cancha]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMensaje("");
    const resultMsgContainer = document.getElementById("result-message");
    if (resultMsgContainer) resultMsgContainer.innerHTML = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (formData.metodoPago === 'paypal') {
      // Check if all required fields for PayPal are filled
      if (!formData.nombre || !formData.email || !formData.fecha || !formData.horario || !formData.cancha) {
        setMensaje("❌ Por favor completa todos los campos del formulario antes de proceder con PayPal.");
        return;
      }
      // If PayPal is selected, the payment is initiated by PayPal buttons.
      // We trigger a re-render of PayPal buttons if not already visible by setting a message
      // or simply let the useEffect handle it. The `isSubmitting` state will show a message.
      if (!isSubmitting) { // If not already in PayPal submission flow
        setMensaje("Por favor, complete el pago usando los botones de PayPal mostrados.");
      }
      return;
    }

    // Standard form validation for other methods (e.g., efectivo)
    if (!formData.nombre || !formData.email || !formData.fecha || !formData.horario || !formData.cancha) {
      setMensaje("❌ Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      const fechaReserva = new Date(formData.fecha);
      if (isNaN(fechaReserva.getTime())) throw new Error("Fecha inválida");
      setIsSubmitting(true);

      if (formData.metodoPago === "efectivo") {
        const token = localStorage.getItem('token');
        const endpoint = token ? '/api/reservas' : '/api/reservas/invitado';
        const reservaData = { ...formData, fecha: fechaReserva };
        const response = await fetch(`http://localhost:4000${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
          body: JSON.stringify(reservaData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Error al crear la reserva");
        setMensaje("✅ Reserva creada exitosamente!");
        setFormData({
          fecha: "", horario: "", cancha: "", metodoPago: "efectivo",
          nombre: "", email: "", telefono: ""
        });
        setTimeout(() => navigate('/mis-reservas'), 2000);
      } else {
        // This case should ideally not be reached if UI is correct
        setMensaje("❌ Método de pago inválido seleccionado.");
      }
    } catch (error) {
      console.error("[ERROR] Detalles:", error);
      setMensaje(`❌ ${error.message || "Error al procesar la reserva. Intenta nuevamente."}`);
    } finally {
      // Only set isSubmitting to false if it's not PayPal,
      // as PayPal flow manages its own isSubmitting state through its callbacks.
      if (formData.metodoPago !== 'paypal') {
        setIsSubmitting(false);
      }
    }
  };

  // Determine if form fields should be disabled
  const formFieldsDisabled = isSubmitting && formData.metodoPago === 'paypal';

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md space-y-4 text-black">
      <h2 className="text-xl font-bold">Reservar Cancha</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1">Nombre completo *</label>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full border p-2 rounded text-black" required disabled={formFieldsDisabled} />
        </div>
        <div>
          <label className="block mb-1">Email *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded text-black" required disabled={formFieldsDisabled} />
        </div>
        <div>
          <label className="block mb-1">Teléfono</label>
          <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full border p-2 rounded text-black" disabled={formFieldsDisabled} />
        </div>
        <div>
          <label className="block mb-1">Fecha *</label>
          <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="w-full border p-2 rounded text-black" required min={new Date().toISOString().split('T')[0]} disabled={formFieldsDisabled} />
        </div>
        <div>
          <label className="block mb-1">Horario *</label>
          <select name="horario" value={formData.horario} onChange={handleChange} className="w-full border p-2 rounded text-black" required disabled={formFieldsDisabled}>
            <option value="">Selecciona un horario</option>
            {horasDisponibles.map((hora) => (<option key={hora} value={hora}>{hora}</option>))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Cancha *</label>
          <select name="cancha" value={formData.cancha} onChange={handleChange} className="w-full border p-2 rounded text-black" required disabled={formFieldsDisabled}>
            <option value="">Selecciona una cancha</option>
            <option value="Fútbol 1">Fútbol 1</option>
            <option value="Fútbol 2">Fútbol 2</option>
            <option value="Fútbol 3">Fútbol 3</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Método de pago *</label>
          <select name="metodoPago" value={formData.metodoPago} onChange={handleChange} className="w-full border p-2 rounded text-black" required>
            <option value="efectivo">Pago en efectivo</option>
            <option value="paypal">PayPal</option>
          </select>
        </div>

        {/* Show "Reservar" button only for non-PayPal methods, or if PayPal is selected but not yet initiated */}
        {formData.metodoPago !== 'paypal' && (
          <button type="submit" className="mt-4 w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50" disabled={isSubmitting}>
            {isSubmitting ? "Procesando..." : "Reservar"}
          </button>
        )}
        {/* If PayPal is selected and form is incomplete, the main submit button is hidden.
            User must fill form, then PayPal buttons appear.
            If PayPal is selected and form is complete, its buttons appear. The main submit is still hidden.
        */}

        {mensaje && <p className={`mt-3 text-center ${mensaje.startsWith('❌') ? 'text-red-500' : 'text-green-500'}`}>{mensaje}</p>}
      </form>

      {/* PayPal UI Placeholders */}
      {formData.metodoPago === 'paypal' && (
        <>
          <div id="paypal-button-container" className="mt-4">
            {/* PayPal buttons will render here. Show a message if form fields are missing. */}
            {(!formData.nombre || !formData.email || !formData.fecha || !formData.horario || !formData.cancha) && !isSubmitting &&
              <p className="text-center text-red-500">Complete todos los campos del formulario para habilitar PayPal.</p>
            }
          </div>
          <div id="result-message" className="mt-2 text-center"></div>
          {isSubmitting && <p className="mt-3 text-center">Procesando pago con PayPal...</p>}
        </>
      )}
    </div>
  );
}
