export const REPRESENTATIVE_THEME_KEY = "legumex.representative.theme"
export type ColorTheme = "light" | "dark"

export function readTheme(storage: Pick<Storage, "getItem">, key: string): ColorTheme {
    try { return storage.getItem(key) === "dark" ? "dark" : "light" }
    catch { return "light" }
}

export function isRepresentativeThemeRoute(pathname: string): boolean {
    return pathname === "/solicitud" || pathname.startsWith("/solicitud/")
}

export function resolveRouteTheme(pathname: string, representativeTheme: ColorTheme, storage: Pick<Storage, "getItem">, authenticated = false): ColorTheme {
    if (isRepresentativeThemeRoute(pathname) && authenticated) return representativeTheme
    if (pathname === "/admin" || pathname.startsWith("/admin/")) return readTheme(storage, "legumex.theme")
    return "light"
}

export function applyColorTheme(root: HTMLElement, theme: ColorTheme) {
    root.classList.toggle("dark", theme === "dark")
    root.dataset.theme = theme
}
