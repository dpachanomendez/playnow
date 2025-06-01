import { Router } from "express";
import {
  handleCreateOrder,
  handleCaptureOrder,
} from "../controllers/paypal.controller.js";

const router = Router();

// Route to create an order
// The client will call this endpoint to initiate a PayPal transaction
router.post("/orders", handleCreateOrder);

// Route to capture the order payment
// After the user approves the payment on PayPal's site,
// the client will call this endpoint with the orderID provided by PayPal
router.post("/orders/:orderID/capture", handleCaptureOrder);

export default router;
