import { Snowflake, Leaf, Zap, Cookie, Package, UtensilsCrossed, Tag } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { SiteImageSlot } from "@/feature/siteImage/schema/siteImage.schema"

export type ProductLine = {
    id: string
    translationKey: string
    icon: LucideIcon
    // Slot que un admin puede reemplazar desde /admin/site-images (ver useSiteImages.ts). Debe
    // coincidir 1:1 con SITE_IMAGE_SLOTS en el backend.
    slotKey: SiteImageSlot
}

// Las 7 líneas de producto de Legumex. El copy (nombre, descripción, sub-categorías) vive en
// i18n bajo `home.lines.items.<id>` -- acá solo se define el orden, el ícono y el slot
// de su foto (subida desde el admin; sin foto subida no se muestra ninguna imagen).
export const PRODUCT_LINES: ProductLine[] = [
    { id: "fresh", translationKey: "fresh", icon: Leaf, slotKey: "line_fresh" },
    { id: "frozen", translationKey: "frozen", icon: Snowflake, slotKey: "line_frozen" },
    { id: "hpp", translationKey: "hpp", icon: Zap, slotKey: "line_hpp" },
    {
        id: "healthySnacks",
        translationKey: "healthySnacks",
        icon: Cookie,
        slotKey: "line_snacks",
    },
    {
        id: "shelfStable",
        translationKey: "shelfStable",
        icon: Package,
        slotKey: "line_shelf",
    },
    {
        id: "foodService",
        translationKey: "foodService",
        icon: UtensilsCrossed,
        slotKey: "line_foodservice",
    },
    {
        id: "privateLabel",
        translationKey: "privateLabel",
        icon: Tag,
        slotKey: "line_privatelabel",
    },
]
