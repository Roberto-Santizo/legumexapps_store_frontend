import { useEffect, useState } from "react"
import { LogOut, Menu, Moon, Sun, UserRound } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/shared/auth/useAuth"
import { LanguageSwitch } from "@/shared/layout/LanguageSwitch"
import { getLayoutTitleKey } from "@/shared/layout/adminNavigation"
import { Button } from "@/shared/component/button.component"

const THEME_STORAGE_KEY = "legumex.theme"
type HeaderProps = { onMenuClick: () => void }

export function Header({ onMenuClick }: Readonly<HeaderProps>) {
    const { t } = useTranslation()
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem(THEME_STORAGE_KEY)
        if (stored) return stored === "dark"
        return document.documentElement.classList.contains("dark") || document.documentElement.dataset.theme === "dark"
    })

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDark)
        document.documentElement.dataset.theme = isDark ? "dark" : "light"
        localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light")
    }, [isDark])

    function handleLogout() {
        logout()
        navigate("/admin/login", { replace: true })
    }

    const titleKey = getLayoutTitleKey(pathname)
    return (
        <header className="sticky top-0 z-30 border-b border-line bg-surface px-[max(1rem,env(safe-area-inset-left))] py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Button variant="secondary" onClick={onMenuClick} aria-label={t("adminLayout.openMenu")} aria-controls="admin-sidebar" className="shrink-0 px-3 sm:px-3 lg:hidden">
                        <Menu size={20} aria-hidden="true" />
                    </Button>
                    <h1 className="min-w-0 text-lg font-semibold leading-snug text-ink-900 sm:text-2xl">{titleKey ? t(titleKey) : "LEGUMEX"}</h1>
                </div>
                <div className="flex max-w-full shrink-0 items-center gap-2 sm:gap-3">
                    <LanguageSwitch />
                    <Button variant="secondary" onClick={() => setIsDark(dark => !dark)} aria-label={t(isDark ? "adminLayout.lightMode" : "adminLayout.darkMode")} className="px-3 sm:px-3">
                        {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
                    </Button>
                    {user && (
                        <div className="hidden min-w-0 items-center gap-2 border-l border-line pl-3 sm:flex" title={`${user.name} ? ${user.role}`}>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-badge bg-canvas text-focus"><UserRound size={18} aria-hidden="true" /></span>
                            <div className="hidden min-w-0 xl:block">
                                <p className="max-w-36 truncate text-sm font-medium text-ink-900">{user.name}</p>
                                <p className="max-w-36 truncate text-xs text-ink-600">{user.role}</p>
                            </div>
                        </div>
                    )}
                    <Button onClick={handleLogout} variant="secondary" aria-label={t("common.logout")} className="px-3 sm:px-4">
                        <LogOut size={18} aria-hidden="true" />
                        <span className="hidden md:inline">{t("common.logout")}</span>
                    </Button>
                </div>
            </div>
        </header>
    )
}
