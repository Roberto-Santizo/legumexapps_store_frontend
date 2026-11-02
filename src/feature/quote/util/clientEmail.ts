import { z } from "zod"

// Correo del cliente del pedido: la MISMA regla que el backend (features/client/schemas/client.schema.ts
// ::clientEmailSchema), para no dar por válido un correo que el envío a revisión rechazaría.
const clientEmailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email())

export function isValidClientEmail(value: string): boolean {
    return clientEmailSchema.safeParse(value).success
}

// Correo opcional del cliente tal como se envía: vacío = sin correo (undefined), válido = el correo sin
// espacios, y escrito pero inválido = null (no se envía hasta corregirlo o borrarlo).
export function optionalClientEmail(value: string): string | undefined | null {
    const trimmed = value.trim()
    if (trimmed === "") return undefined
    return isValidClientEmail(trimmed) ? trimmed : null
}
