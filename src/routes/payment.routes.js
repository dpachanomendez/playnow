import { Router } from "express";
import { createPreference } from "../controllers/payment.controller.js";

const router = Router();

// Ruta para crear preferencia de pago Mercado Pago
router.post("/create-preference", createPreference);

export default router;
