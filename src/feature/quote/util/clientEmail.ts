import { z } from "zod"

// Correo del cliente del pedido: la MISMA regla que el backend (features/client/schemas/client.schema.ts
// ::clientEmailSchema), para no dar por válido un correo que el envío a revisión rechazaría.
const clientEmailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email())

export function isValidClientEmail(value: string): boolean {
    return clientEmailSchema.safeParse(value).success
}
