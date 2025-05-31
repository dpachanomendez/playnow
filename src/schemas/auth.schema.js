import { z } from "zod";

export const registerSchema = z.object({
  username: z.string({
    required_error: "El nombre es obligatorio",
  }),
  email: z
    .string({
      required_error: "El correo electrónico es obligatorio",
    })
    .email({
      message: "Por favor, ingresa un correo electrónico válido",
    }),

  phone: z
    .string()
    .regex(/^\d{9}$/, "El número de teléfono debe tener exactamente 9 dígitos"),
  password: z
    .string({
      required_error: "La contraseña es obligatoria",
    })
    .min(6, {
      message: "La contraseña debe tener al menos 6 caracteres",
    }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
