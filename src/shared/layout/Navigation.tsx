import { useEffect, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { ChevronDown } from "lucide-react"
import { DASHBOARD_ITEM, NAV_GROUPS } from "@/shared/layout/adminNavigation"
import type { NavItem } from "@/shared/layout/adminNavigation"
import { useTranslation } from "react-i18next"
import { usePermission } from "@/shared/auth/usePermission"

function navLinkClassName({ isActive }: { isActive: boolean }): string {
    return `relative flex min-h-11 items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
        isActive ? "bg-brand-300/20 text-brand-900 before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full before:bg-brand-900 dark:text-brand-500 dark:before:bg-brand-500" : "text-ink-600 hover:bg-canvas hover:text-ink-900"
    }`
}

function NavItemLink({ url, labelKey, icon: Icon }: Readonly<NavItem>) {
    const { t } = useTranslation()
    const location = useLocation()
    const customQuoteDetail = url === "/admin/quotes" && location.pathname.startsWith("/admin/custom-quotes/")

    return (
        <NavLink to={url} className={({ isActive }) => navLinkClassName({ isActive: isActive || customQuoteDetail })}>
            <Icon size={18} className="shrink-0" aria-hidden="true" />
            <span className="min-w-0">{t(labelKey)}</span>
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
        <div className="mt-4 border-t border-line pt-4 first:mt-0 first:border-t-0 first:pt-0">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between min-h-10 rounded-control px-3 py-2 text-xs font-medium uppercase tracking-wider text-ink-400 transition-colors hover:bg-canvas hover:text-ink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
                {t(labelKey)}
                <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <div
                id={panelId}
                inert={!isOpen}
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
        items: group.items.filter((item) => (Array.isArray(item.permission) ? item.permission.some(hasPermission) : hasPermission(item.permission))),
    })).filter((group) => group.items.length > 0)

    const activeGroupId = visibleGroups.find((group) =>
        group.items.some((item) => location.pathname.startsWith(item.url) || (item.url === "/admin/quotes" && location.pathname.startsWith("/admin/custom-quotes/")))
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
        <nav className="scrollbar-thin flex flex-1 flex-col gap-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {(Array.isArray(DASHBOARD_ITEM.permission) ? DASHBOARD_ITEM.permission.some(hasPermission) : hasPermission(DASHBOARD_ITEM.permission)) && <NavItemLink {...DASHBOARD_ITEM} />}

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

