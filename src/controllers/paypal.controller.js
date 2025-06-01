import checkoutNodeJssdk from "@paypal/checkout-server-sdk";
import "dotenv/config"; // To load .env variables

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

// Creating an environment
let environment = new checkoutNodeJssdk.core.SandboxEnvironment(
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET
);
let client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

// Construct a request object and set desired parameters
// Here, OrdersCreateRequest() creates a POST request to /v2/checkout/orders
async function createOrder(cart, debug = false) {
  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD", // Or your desired currency
          value: "100.00", // Calculate this based on the cart or item
        },
        description: "Reserva de cancha", // Or a more dynamic description
      },
    ],
  });

  let order;
  try {
    order = await client.execute(request);
  } catch (err) {
    // Handle API errors
    console.error("Error creating PayPal order:", err);
    // A specific format for error response might be good
    if (err.isAxiosError) { // AxiosError is from older SDK versions, now it's ApiError
        console.error("Axios Error data:",err.response.data)
    } else if (err.name === 'ApiError' || err instanceof checkoutNodeJssdk.core.ApiError) { // Check for ApiError
        console.error("API Error details:", JSON.stringify(err.result, null, 2));
    }
    throw err; // Re-throw for the handler to catch
  }

  return {
    jsonResponse: { orderID: order.result.id }, // order.result contains the response body
    httpStatusCode: order.statusCode,
  };
}

// Capture an order
async function captureOrder(orderID, debug = false) {
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
  request.requestBody({}); // Empty request body for capture

  let capture;
  try {
    capture = await client.execute(request);
    // Successfully captured the order
  } catch (err) {
    // Handle API errors
    console.error("Error capturing PayPal order:", err);
    if (err.isAxiosError) { // AxiosError is from older SDK versions, now it's ApiError
        console.error("Axios Error data:",err.response.data)
    } else if (err.name === 'ApiError' || err instanceof checkoutNodeJssdk.core.ApiError) { // Check for ApiError
        console.error("API Error details:", JSON.stringify(err.result, null, 2));
    }
    throw err; // Re-throw for the handler to catch
  }

  return {
    jsonResponse: capture.result, // capture.result contains the response body
    httpStatusCode: capture.statusCode,
  };
}

// --- Express Handler Functions ---

export const handleCreateOrder = async (req, res) => {
  try {
    // For now, using a dummy cart. Replace with actual cart data from req.body or session.
    const cart = req.body.cart || [{ id: "item1", quantity: 1, price: "100.00" }];

    // Modify createOrder to accept cart and calculate total amount
    // For simplicity, keeping the hardcoded amount in createOrder for now
    const { jsonResponse, httpStatusCode } = await createOrder(cart);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    // Check if the error is an ApiError from PayPal SDK
    if (error.name === 'ApiError' || error instanceof checkoutNodeJssdk.core.ApiError) {
      res.status(error.statusCode || 500).json({ error: error.message, details: error.result });
    } else {
      res.status(500).json({ error: error.message || "Failed to create order." });
    }
  }
};

export const handleCaptureOrder = async (req, res) => {
  try {
    const { orderID } = req.params;
    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    if (error.name === 'ApiError' || error instanceof checkoutNodeJssdk.core.ApiError) {
      res.status(error.statusCode || 500).json({ error: error.message, details: error.result });
    } else {
      res.status(500).json({ error: error.message || "Failed to capture order." });
    }
  }
};

// Helper to generate an access token (not directly used for order creation/capture with SDK client)
// The SDK handles token generation and refreshing internally.
// This is more for manual API calls if not using the SDK's execute method.
/*
async function generateAccessToken() {
  const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET).toString("base64");
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  const data = await response.json();
  return data.access_token;
}
*/

export { createOrder, captureOrder }; // Export core functions if needed elsewhere, though handlers are primary
