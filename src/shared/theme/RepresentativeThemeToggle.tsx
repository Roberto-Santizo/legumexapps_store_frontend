import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/shared/component/button.component"
import { useRepresentativeTheme } from "./representativeThemeContext"
import { useLocation } from "react-router-dom"
import { useSalespersonAuth } from "@/shared/auth/salesperson/useSalespersonAuth"
import { isRepresentativeThemeRoute } from "./representativeTheme"

export function RepresentativeThemeToggle() {
    const { t } = useTranslation()
    const { theme, toggle } = useRepresentativeTheme()
    const { pathname } = useLocation()
    const { salesperson } = useSalespersonAuth()
    if (!salesperson || !isRepresentativeThemeRoute(pathname)) return null
    const label = t(theme === "dark" ? "adminLayout.lightMode" : "adminLayout.darkMode")
    return <Button variant="secondary" onClick={toggle} aria-label={label} title={label} className="px-3 sm:px-3">
        {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </Button>
}
