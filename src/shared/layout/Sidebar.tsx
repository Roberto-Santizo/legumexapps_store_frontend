import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Navigation } from "@/shared/layout/Navigation"
import { Button } from "@/shared/component/button.component"
import logo from "@/assets/legumex-logo.png"

type SidebarProps = { isOpen: boolean; onClose: () => void }

export function Sidebar({ isOpen, onClose }: Readonly<SidebarProps>) {
    const { t } = useTranslation()
    const { pathname } = useLocation()
    const drawerRef = useRef<HTMLElement>(null)
    const closeRef = useRef(onClose)
    closeRef.current = onClose

    useEffect(() => { closeRef.current() }, [pathname])
    useEffect(() => {
        if (!isOpen) return
        const breakpoint = window.matchMedia("(min-width: 1024px)")
        if (breakpoint.matches) { closeRef.current(); return }
        const previousFocus = document.activeElement as HTMLElement | null
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        const focusTimer = window.setTimeout(() => drawerRef.current?.querySelector<HTMLButtonElement>("button")?.focus(), 210)
        const handleResize = () => { if (breakpoint.matches) closeRef.current() }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeRef.current()
            if (event.key !== "Tab") return
            const controls = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []).filter(element => element.getClientRects().length && !element.closest('[inert]'))
            const first = controls[0]
            const last = controls[controls.length - 1]
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
        }
        breakpoint.addEventListener("change", handleResize)
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            window.clearTimeout(focusTimer)
            document.body.style.overflow = previousOverflow
            breakpoint.removeEventListener("change", handleResize)
            document.removeEventListener("keydown", handleKeyDown)
            previousFocus?.focus()
        }
    }, [isOpen])

    return (
        <>
            {isOpen && <button type="button" aria-label={t("common.closeMenu")} className="fixed inset-0 z-40 bg-brand-900/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
            <aside id="admin-sidebar" ref={drawerRef} aria-label={t("adminLayout.navigation")} className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[calc(100vw-2rem)] flex-col border-r border-line bg-surface pt-[env(safe-area-inset-top)] transition-[transform,visibility] duration-200 motion-reduce:transition-none lg:visible lg:translate-x-0 ${isOpen ? "visible translate-x-0" : "invisible -translate-x-full"}`}>
                <div className="relative flex shrink-0 items-center justify-center border-b border-line px-6 py-5">
                    <img src={logo} alt={t("common.logoAlt")} className="h-32 w-40 rounded-control bg-white object-contain" />
                    <Button onClick={onClose} variant="secondary" aria-label={t("common.closeMenu")} className="absolute right-2 top-2 px-2 sm:px-2 lg:hidden"><X size={18} aria-hidden="true" /></Button>
                </div>
                <div className="flex min-h-0 flex-1 flex-col pt-4"><Navigation /></div>
            </aside>
        </>
    )
}
