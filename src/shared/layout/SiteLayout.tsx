import { Outlet, useLocation } from "react-router-dom"
import { AnnouncementBar } from "@/shared/layout/AnnouncementBar"
import { SiteHeader } from "@/shared/layout/SiteHeader"
import { SiteFooter } from "@/shared/layout/SiteFooter"
import { useLenisScroll } from "@/shared/hook/useLenisScroll"

export function SiteLayout() {
    useLenisScroll()

    const { pathname } = useLocation()
    const isHome = pathname === "/"

    return (
        <div className="flex min-h-screen flex-col bg-crema">
            {!isHome && <AnnouncementBar />}
            <SiteHeader />
            <main className="flex-1">
                <Outlet />
            </main>
            <SiteFooter />
        </div>
    )
}
