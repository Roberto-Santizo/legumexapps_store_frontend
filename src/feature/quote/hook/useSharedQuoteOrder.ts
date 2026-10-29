import { useRef, useState } from "react"
import { z } from "zod"
import { representativeQuoteLineSchema } from "../schema/quote.schema"
import type { QuoteDocumentLine } from "../schema/quote.schema"
import { useSalespersonAuth } from "@/shared/auth/salesperson/useSalespersonAuth"
import { QUOTE_ORDER_STORAGE_PREFIX } from "@/shared/auth/salesperson/salespersonAuthStorage"

// clientEmail: a dónde irá la cotización aprobada; se precarga con el correo del cliente registrado.
type Order = { id: string; clientName: string; clientId: number | null; clientEmail: string; selected: boolean; lines: QuoteDocumentLine[] }
// Pedido del representante: líneas sin montos. Un pedido guardado antes con montos se lee igual y los
// pierde al parsear (zod descarta las claves que no conoce).
const storedLineSchema = representativeQuoteLineSchema.extend({ composition: z.object({
    context: z.object({ categoryName: z.string(), subCategoryName: z.string(), isOrganic: z.boolean().optional(), ingredientType: z.string() }).optional(),
    rawMaterials: z.array(z.object({ displayName: z.string(), percentage: z.number() })),
    ingredients: z.array(z.object({ displayName: z.string(), gramsPerUnit: z.number() })),
}).optional() })
const storedOrderSchema = z.object({ id: z.string().uuid(), clientName: z.string().max(150), clientId: z.number().int().positive().nullable(), clientEmail: z.string().max(254).default(""), selected: z.boolean(), lines: z.array(storedLineSchema) })
const emptyOrder = (): Order => ({ id: crypto.randomUUID(), clientName: "", clientId: null, clientEmail: "", selected: false, lines: [] })

// One customer order across both routes, retained when navigating or refreshing this tab.
export function useSharedQuoteOrder() {
    const { salesperson } = useSalespersonAuth()
    const storageKey = `${QUOTE_ORDER_STORAGE_PREFIX}${salesperson?.id}`
    const [order, setOrder] = useState<Order>(() => {
        try {
            const result = storedOrderSchema.safeParse(JSON.parse(sessionStorage.getItem(storageKey) ?? "null"))
            if (result.success) return result.data
        } catch { /* Start a new order when storage is unavailable or invalid. */ }
        return emptyOrder()
    })
    const current = useRef(order)
    current.current = order
    function update(next: Order) {
        current.current = next
        setOrder(next)
        try { sessionStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* The active order remains usable in memory. */ }
    }
    return {
        ...order,
        identity: { id: order.id, clientName: order.clientName.trim(), clientId: order.clientId },
        isCurrentOrder: (id: string) => current.current.id === id,
        selectClient: (clientId: number | null, clientName: string, clientEmail = "") => update({ ...emptyOrder(), selected: true, clientId, clientName, clientEmail }),
        setClientEmail: (clientEmail: string) => update({ ...current.current, clientEmail }),
        setClientName: (clientName: string) => { if (!current.current.lines.length && current.current.clientId === null) update({ ...current.current, id: crypto.randomUUID(), clientName }) },
        addLine: (line: QuoteDocumentLine) => {
            const active = current.current
            if (!active.selected || line.breakdown.order?.id !== active.id || line.breakdown.order.clientId !== active.clientId) return
            try {
                const stored = sessionStorage.getItem(storageKey)
                if (stored && JSON.parse(stored).id !== active.id) return
            } catch { /* In-memory identity still protects the active page. */ }
            update({ ...active, clientName: line.breakdown.order.clientName, lines: [...active.lines, line] })
        },
        clear: () => update(emptyOrder()),
    }
}
