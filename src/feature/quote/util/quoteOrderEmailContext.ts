import { createContext } from "react"

// Correo del cliente del pedido del representante, para mostrarlo junto a "Calcular cotización" (que
// también envía el pedido a revisión). Sin proveedor (calculadora del admin) no se muestra nada.
export const QuoteOrderEmailContext = createContext<{ email: string; onChange: (email: string) => void } | null>(null)
