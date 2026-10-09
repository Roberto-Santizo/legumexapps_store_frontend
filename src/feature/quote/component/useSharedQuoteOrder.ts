import { useState } from "react"
import { z } from "zod"
import { quoteLineSchema } from "../schema/quote.schema"
import type { QuoteDocumentLine } from "../schema/quote.schema"
import { useSalespersonAuth } from "@/shared/auth/salesperson/useSalespersonAuth"

type Order = { id: string; clientName: string; lines: QuoteDocumentLine[] }
const storedLineSchema = quoteLineSchema.extend({ composition: z.object({
    context: z.object({ categoryName: z.string(), subCategoryName: z.string(), isOrganic: z.boolean(), ingredientType: z.string() }).optional(),
    rawMaterials: z.array(z.object({ displayName: z.string(), percentage: z.number() })),
    ingredients: z.array(z.object({ displayName: z.string(), gramsPerUnit: z.number() })),
}).optional() })
const storedOrderSchema = z.object({ id: z.string().uuid(), clientName: z.string().max(150), lines: z.array(storedLineSchema) })
const emptyOrder = (): Order => ({ id: crypto.randomUUID(), clientName: "", lines: [] })

// One customer order across both routes, retained when navigating or refreshing this tab.
export function useSharedQuoteOrder() {
    const { salesperson } = useSalespersonAuth()
    const storageKey = `legumex.quoteOrder.v1.${salesperson?.id}`
    const [order, setOrder] = useState<Order>(() => {
        try {
            const result = storedOrderSchema.safeParse(JSON.parse(sessionStorage.getItem(storageKey) ?? "null"))
            if (result.success) return result.data
        } catch { /* Start a new order when storage is unavailable or invalid. */ }
        return emptyOrder()
    })
    function update(next: Order) {
        setOrder(next)
        try { sessionStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* The active order remains usable in memory. */ }
    }
    return {
        ...order,
        identity: { id: order.id, clientName: order.clientName.trim() },
        setClientName: (clientName: string) => { if (!order.lines.length) update({ ...order, clientName }) },
        addLine: (line: QuoteDocumentLine) => update({ ...order, id: line.breakdown.order?.id ?? order.id, clientName: line.breakdown.order?.clientName ?? order.clientName, lines: [...order.lines, line] }),
        clear: () => update(emptyOrder()),
    }
}
