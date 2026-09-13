import { useEffect, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import {
    Calculator,
    Carrot,
    ChevronDown,
    ClipboardList,
    Cog,
    FolderTree,
    Image,
    Inbox,
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

type NavItem = {
    url: string
    labelKey: string
    icon: LucideIcon
    permission: string
}

type NavGroup = {
    id: string
    labelKey: string
    items: NavItem[]
}

const DASHBOARD_ITEM: NavItem = { url: "/admin/dashboard", labelKey: "dashboard.title", icon: LayoutDashboard, permission: "dashboard:view" }

const NAV_GROUPS: NavGroup[] = [
    {
        id: "quotes",
        labelKey: "nav.groups.quotes",
        items: [
            { url: "/admin/quotes", labelKey: "adminQuote.list.title", icon: ClipboardList, permission: "quotes:view" },
            { url: "/admin/quotes/calculator", labelKey: "adminQuoteCalculator.title", icon: Calculator, permission: "quotes:calculate" },
        ],
    },
    {
        id: "catalog",
        labelKey: "nav.groups.catalog",
        items: [
            { url: "/admin/products", labelKey: "product.list.title", icon: ShoppingBag, permission: "products:view" },
            { url: "/admin/categories", labelKey: "category.list.title", icon: FolderTree, permission: "categories:view" },
            { url: "/admin/sub-categories", labelKey: "subCategory.list.title", icon: Layers, permission: "subCategories:view" },
            { url: "/admin/product-types", labelKey: "productType.list.title", icon: Shapes, permission: "productTypes:view" },
            { url: "/admin/ingredients", labelKey: "ingredient.list.title", icon: Carrot, permission: "ingredients:view" },
            { url: "/admin/packagings", labelKey: "packaging.list.title", icon: Package, permission: "packagings:view" },
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
            { url: "/admin/customers", labelKey: "customer.list.title", icon: Users, permission: "customers:view" },
            { url: "/admin/leads", labelKey: "lead.list.title", icon: Inbox, permission: "leads:view" },
            { url: "/admin/site-images", labelKey: "siteImage.list.title", icon: Image, permission: "siteContent:edit" },
            { url: "/admin/users", labelKey: "user.list.title", icon: UserCog, permission: "users:view" },
            { url: "/admin/roles", labelKey: "role.list.title", icon: ShieldCheck, permission: "roles:view" },
        ],
    },
]

function navLinkClassName({ isActive }: { isActive: boolean }): string {
    return `flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition ${
        isActive ? "bg-verde-tinta text-dorado" : "text-crema/80 hover:bg-verde-tinta hover:text-crema"
    }`
}

function NavItemLink({ url, labelKey, icon: Icon }: Readonly<NavItem>) {
    const { t } = useTranslation()

    return (
        <NavLink to={url} className={navLinkClassName}>
            <Icon size={18} />
            {t(labelKey)}
        </NavLink>
    )
}

type NavGroupSectionProps = {
    id: string
    labelKey: string
    items: NavItem[]
    isOpen: boolean
    onToggle: () => void
}

function NavGroupSection({ id, labelKey, items, isOpen, onToggle }: Readonly<NavGroupSectionProps>) {
    const { t } = useTranslation()
    const panelId = `nav-group-panel-${id}`

    return (
        <div className="border-t border-crema/15 pt-3 first:border-t-0 first:pt-0">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between rounded-[10px] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.06em] text-crema/60 transition hover:text-crema"
            >
                {t(labelKey)}
                <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <div
                id={panelId}
                className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
                <div className="overflow-hidden">
                    <div className="space-y-1 pt-1">
                        {items.map((item) => (
                            <NavItemLink key={item.url} {...item} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function Navigation() {
    const { hasPermission } = usePermission()
    const location = useLocation()

    const visibleGroups = NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => hasPermission(item.permission)),
    })).filter((group) => group.items.length > 0)

    const activeGroupId = visibleGroups.find((group) =>
        group.items.some((item) => location.pathname.startsWith(item.url))
    )?.id

    const [openGroupIds, setOpenGroupIds] = useState<Set<string>>(() => new Set(activeGroupId ? [activeGroupId] : []))


    useEffect(() => {
        if (!activeGroupId) return
        setOpenGroupIds((prev) => (prev.has(activeGroupId) ? prev : new Set(prev).add(activeGroupId)))
    }, [activeGroupId])

    function toggleGroup(groupId: string): void {
        setOpenGroupIds((prev) => {
            const next = new Set(prev)
            if (next.has(groupId)) {
                next.delete(groupId)
            } else {
                next.add(groupId)
            }
            return next
        })
    }

    return (
        <nav className="scrollbar-thin flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
            {hasPermission(DASHBOARD_ITEM.permission) && <NavItemLink {...DASHBOARD_ITEM} />}

            {visibleGroups.map((group) => (
                <NavGroupSection
                    key={group.id}
                    id={group.id}
                    labelKey={group.labelKey}
                    items={group.items}
                    isOpen={openGroupIds.has(group.id)}
                    onToggle={() => toggleGroup(group.id)}
                />
            ))}
        </nav>
    )
}
