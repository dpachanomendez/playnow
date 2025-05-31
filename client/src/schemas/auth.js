import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({
    message: "Por favor, ingresa un correo electrónico válido",
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  }),
});

export const registerSchema = z
  .object({
    username: z
      .string({
        required_error: "El nombre es obligatorio",
      })
      .min(3, {
        message: "El nombre debe tener al menos 3 caracteres",
      }),
    email: z.string().email({
      message: "Por favor, ingresa un correo electrónico válido",
    }),
    phone: z.string().min(9, {
      message: "El número de teléfono debe tener exactamente 9 dígitos",
    }),
    password: z.string().min(6, {
      message: "La contraseña debe tener al menos 6 caracteres",
    }),
    confirmPassword: z.string().min(6, {
      message: "La confirmación de la contraseña es obligatoria",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
