import type { LucideIcon } from "lucide-react"
import {
    Calculator,
    Carrot,
    FlaskConical,
    ClipboardList,
    Cog,
    Contact,
    FileClock,
    FolderTree,
    Image,
    Inbox,
    LayoutDashboard,
    Layers,
    MapPin,
    Package,
    PackageOpen,
    Ruler,
    ShieldCheck,
    ShoppingBag,
    GlassWater,
    SlidersHorizontal,
    UserCog,
    Users,
} from "lucide-react"

export type NavItem = {
    url: string
    labelKey: string
    icon: LucideIcon
    permission: string | string[]
}

type NavGroup = {
    id: string
    labelKey: string
    items: NavItem[]
}

export const DASHBOARD_ITEM: NavItem = { url: "/admin/dashboard", labelKey: "dashboard.title", icon: LayoutDashboard, permission: "dashboard:view" }

export const NAV_GROUPS: NavGroup[] = [
    {
        id: "quotes",
        labelKey: "nav.groups.quotes",
        items: [
            { url: "/admin/quotes", labelKey: "adminQuote.list.title", icon: ClipboardList, permission: ["quotes:view", "customQuotes:view"] },
            { url: "/admin/quote-drafts", labelKey: "quoteDraft.list.title", icon: FileClock, permission: "quoteDrafts:view" },
            { url: "/admin/quotes/calculator", labelKey: "adminQuoteCalculator.title", icon: Calculator, permission: "quotes:calculate" },
        ],
    },
    {
        id: "catalog",
        labelKey: "nav.groups.catalog",
        items: [
            { url: "/admin/products", labelKey: "product.list.title", icon: ShoppingBag, permission: "products:view" },
            { url: "/admin/juices", labelKey: "juice.title", icon: GlassWater, permission: "juices:view" },
            { url: "/admin/juice-config", labelKey: "juice.configTitle", icon: SlidersHorizontal, permission: "juiceConfig:edit" },
            { url: "/admin/categories", labelKey: "category.list.title", icon: FolderTree, permission: "categories:view" },
            { url: "/admin/sub-categories", labelKey: "subCategory.list.title", icon: Layers, permission: "subCategories:view" },
            { url: "/admin/raw-materials", labelKey: "rawMaterial.list.title", icon: Carrot, permission: "rawMaterials:view" },
            { url: "/admin/ingredients", labelKey: "ingredient.list.title", icon: FlaskConical, permission: "ingredients:view" },
            { url: "/admin/packagings", labelKey: "packaging.list.title", icon: Package, permission: "packagings:view" },
            { url: "/admin/packaging-groups", labelKey: "packagingGroup.title", icon: Layers, permission: "packagingGroups:view" },
            { url: "/admin/presentations", labelKey: "presentation.list.title", icon: PackageOpen, permission: "presentations:view" },
            { url: "/admin/units", labelKey: "unit.list.title", icon: Ruler, permission: "units:view" },
            { url: "/admin/destinations", labelKey: "destination.list.title", icon: MapPin, permission: "destinations:view" },
            { url: "/admin/processing-costs", labelKey: "processingCost.list.title", icon: Cog, permission: "processingCosts:view" },
        ],
    },
    {
        id: "administration",
        labelKey: "nav.groups.administration",
        items: [
            { url: "/admin/clients", labelKey: "client.list.title", icon: Contact, permission: "clients:view" },
            { url: "/admin/salespeople", labelKey: "salesperson.list.title", icon: Users, permission: "salespeople:view" },
            { url: "/admin/leads", labelKey: "lead.list.title", icon: Inbox, permission: "leads:view" },
            { url: "/admin/site-images", labelKey: "siteImage.list.title", icon: Image, permission: "siteContent:edit" },
            { url: "/admin/users", labelKey: "user.list.title", icon: UserCog, permission: "users:view" },
            { url: "/admin/roles", labelKey: "role.list.title", icon: ShieldCheck, permission: "roles:view" },
        ],
    },
]

export function getLayoutTitleKey(pathname: string): string | undefined {
    if (pathname === "/admin/custom-quotes" || pathname.startsWith("/admin/custom-quotes/")) return "adminQuote.list.title"
    return [DASHBOARD_ITEM, ...NAV_GROUPS.flatMap(group => group.items)]
        .filter(item => pathname === item.url || pathname.startsWith(`${item.url}/`))
        .sort((a, b) => b.url.length - a.url.length)[0]?.labelKey
}
