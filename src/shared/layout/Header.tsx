import { LogOut, Menu } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/shared/auth/useAuth"
import { LanguageSwitch } from "@/shared/layout/LanguageSwitch"

type HeaderProps = {
    onMenuClick: () => void
}

export function Header({ onMenuClick }: Readonly<HeaderProps>) {
    const { t } = useTranslation()
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    function handleLogout() {
        logout()
        navigate("/admin/login", { replace: true })
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-gris-campo bg-hueso px-4 sm:px-6">
            <button onClick={onMenuClick} className="shrink-0 text-verde-profundo lg:hidden" type="button">
                <Menu size={22} />
            </button>

            <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-4">
                <LanguageSwitch />
                {user && (
                    <span className="hidden max-w-36 truncate text-sm font-medium text-verde-profundo sm:inline">
                        {user.name}
                    </span>
                )}
                <button
                    onClick={handleLogout}
                    type="button"
                    aria-label={t("common.logout")}
                    className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-texto-suave transition hover:text-verde-profundo"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">{t("common.logout")}</span>
                </button>
            </div>
        </header>
    )
}
