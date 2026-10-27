import { createContext, useContext } from "react"
import type { ColorTheme } from "./representativeTheme"

export const RepresentativeThemeContext = createContext<{ theme: ColorTheme; toggle: () => void } | null>(null)

export function useRepresentativeTheme() {
    const context = useContext(RepresentativeThemeContext)
    if (!context) throw new Error("Representative theme provider is missing")
    return context
}
