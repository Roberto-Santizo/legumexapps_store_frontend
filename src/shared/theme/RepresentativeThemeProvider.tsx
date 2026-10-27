import { useLayoutEffect, useState } from "react"
import type { ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { useSalespersonAuth } from "@/shared/auth/salesperson/useSalespersonAuth"
import { applyColorTheme, readTheme, REPRESENTATIVE_THEME_KEY, resolveRouteTheme } from "./representativeTheme"
import type { ColorTheme } from "./representativeTheme"
import { RepresentativeThemeContext } from "./representativeThemeContext"

const storage = { getItem: (key: string) => window.localStorage.getItem(key) }

export function RepresentativeThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
    const { pathname } = useLocation()
    const { salesperson } = useSalespersonAuth()
    const [theme, setTheme] = useState<ColorTheme>(() => readTheme(storage, REPRESENTATIVE_THEME_KEY))
    useLayoutEffect(() => {
        applyColorTheme(document.documentElement, resolveRouteTheme(pathname, theme, storage, Boolean(salesperson)))
        return () => applyColorTheme(document.documentElement, "light")
    }, [pathname, theme, salesperson])

    function toggle() {
        const next = theme === "dark" ? "light" : "dark"
        try { window.localStorage.setItem(REPRESENTATIVE_THEME_KEY, next) } catch { /* The current session still supports theme changes. */ }
        setTheme(next)
    }
    return <RepresentativeThemeContext.Provider value={{ theme, toggle }}>{children}</RepresentativeThemeContext.Provider>
}
