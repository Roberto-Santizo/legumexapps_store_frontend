import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Header } from "@/shared/layout/Header"
import { Sidebar } from "@/shared/layout/Sidebar"

export function AppLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="min-h-dvh bg-canvas text-ink-900 lg:pl-64">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex min-h-dvh min-w-0 flex-col">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <main id="admin-content" className="min-w-0 flex-1 px-[max(1rem,env(safe-area-inset-left))] py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
