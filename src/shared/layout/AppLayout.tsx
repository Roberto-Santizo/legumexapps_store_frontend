import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Header } from "@/shared/layout/Header"
import { Sidebar } from "@/shared/layout/Sidebar"

export function AppLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-crema lg:pl-64">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex min-h-screen flex-col">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
