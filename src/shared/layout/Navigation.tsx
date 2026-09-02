import { NavLink } from "react-router-dom"
import {
    Calculator,
    Carrot,
    ClipboardList,
    FolderTree,
    LayoutDashboard,
    Layers,
    MapPin,
    Package,
    PackageOpen,
    Ruler,
    Shapes,
    ShieldCheck,
    ShoppingBag,
    UserCog,
    Users,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { usePermission } from "@/shared/auth/usePermission"

const NAV_ITEMS = [
    { url: "/admin/dashboard", labelKey: "dashboard.title", icon: LayoutDashboard, permission: "dashboard:view" },
    { url: "/admin/quotes", labelKey: "adminQuote.list.title", icon: ClipboardList, permission: "quotes:view" },
    { url: "/admin/quotes/calculator", labelKey: "adminQuoteCalculator.title", icon: Calculator, permission: "quotes:calculate" },
    { url: "/admin/products", labelKey: "product.list.title", icon: ShoppingBag, permission: "products:view" },
    { url: "/admin/customers", labelKey: "customer.list.title", icon: Users, permission: "customers:view" },
    { url: "/admin/users", labelKey: "user.list.title", icon: UserCog, permission: "users:view" },
    { url: "/admin/roles", labelKey: "role.list.title", icon: ShieldCheck, permission: "roles:view" },
    { url: "/admin/categories", labelKey: "category.list.title", icon: FolderTree, permission: "categories:view" },
    { url: "/admin/sub-categories", labelKey: "subCategory.list.title", icon: Layers, permission: "subCategories:view" },
    { url: "/admin/product-types", labelKey: "productType.list.title", icon: Shapes, permission: "productTypes:view" },
    { url: "/admin/units", labelKey: "unit.list.title", icon: Ruler, permission: "units:view" },
    { url: "/admin/ingredients", labelKey: "ingredient.list.title", icon: Carrot, permission: "ingredients:view" },
    { url: "/admin/packagings", labelKey: "packaging.list.title", icon: Package, permission: "packagings:view" },
    { url: "/admin/presentations", labelKey: "presentation.list.title", icon: PackageOpen, permission: "presentations:view" },
    { url: "/admin/destinations", labelKey: "destination.list.title", icon: MapPin, permission: "destinations:view" },
]

export function Navigation() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.permission))

    return (
        <nav className="space-y-1 px-3">
            {visibleItems.map(({ url, labelKey, icon: Icon }) => (
                <NavLink
                    key={url}
                    to={url}
                    className={({ isActive }) =>
                        `flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition ${
                            isActive ? "bg-verde-tinta text-dorado" : "text-crema/80 hover:bg-verde-tinta hover:text-crema"
                        }`
                    }
                >
                    <Icon size={18} />
                    {t(labelKey)}
                </NavLink>
            ))}
        </nav>
    )
}
