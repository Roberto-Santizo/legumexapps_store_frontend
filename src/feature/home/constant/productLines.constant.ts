import { Snowflake, Leaf, Zap, Cookie, Package, UtensilsCrossed, Tag } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PRODUCT_LINE_IMAGES } from "@/feature/home/constant/homeImages.constant"
import type { SiteImageSlot } from "@/feature/siteImage/schema/siteImage.schema"

export type ProductLine = {
    id: string
    translationKey: string
    image: string
    icon: LucideIcon
    // Slot que un admin puede reemplazar desde /admin/site-images (ver useSiteImages.ts). Debe
    // coincidir 1:1 con SITE_IMAGE_SLOTS en el backend.
    slotKey: SiteImageSlot
}

// Las 7 líneas de producto de Legumex. El copy (nombre, descripción, sub-categorías) vive en
// i18n bajo `home.lines.items.<id>` -- acá solo se define el orden, la imagen (bundled default,
// reemplazable por slot) y el ícono.
export const PRODUCT_LINES: ProductLine[] = [
    { id: "fresh", translationKey: "fresh", image: PRODUCT_LINE_IMAGES.fresh, icon: Leaf, slotKey: "line_fresh" },
    { id: "frozen", translationKey: "frozen", image: PRODUCT_LINE_IMAGES.frozen, icon: Snowflake, slotKey: "line_frozen" },
    { id: "hpp", translationKey: "hpp", image: PRODUCT_LINE_IMAGES.hpp, icon: Zap, slotKey: "line_hpp" },
    {
        id: "healthySnacks",
        translationKey: "healthySnacks",
        image: PRODUCT_LINE_IMAGES.healthySnacks,
        icon: Cookie,
        slotKey: "line_snacks",
    },
    {
        id: "shelfStable",
        translationKey: "shelfStable",
        image: PRODUCT_LINE_IMAGES.shelfStable,
        icon: Package,
        slotKey: "line_shelf",
    },
    {
        id: "foodService",
        translationKey: "foodService",
        image: PRODUCT_LINE_IMAGES.foodService,
        icon: UtensilsCrossed,
        slotKey: "line_foodservice",
    },
    {
        id: "privateLabel",
        translationKey: "privateLabel",
        image: PRODUCT_LINE_IMAGES.privateLabel,
        icon: Tag,
        slotKey: "line_privatelabel",
    },
]
