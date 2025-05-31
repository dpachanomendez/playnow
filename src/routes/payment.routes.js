import { Router } from "express";
import {
  createPreference,
  processPayment,
} from "../controllers/payment.controller.js";

const router = Router();

// Ruta para crear preferencia de pago Mercado Pago
router.post("/create-preference", createPreference);

// Ruta para procesar el pago
router.post("/process_payment", processPayment);

export default router;
