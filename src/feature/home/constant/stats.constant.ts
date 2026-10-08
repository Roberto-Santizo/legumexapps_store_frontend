import { Award, Users, Globe, CloudSun, MapPinned } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type StatItem = {
    id: string
    icon: LucideIcon
    value: number
    suffix: string
    translationKey: string
}

// El label de cada stat vive en i18n bajo `home.stats.items.<id>`; el valor y el sufijo viven acá
// porque alimentan directamente el contador animado (react-countup).
export const HOME_STATS: StatItem[] = [
    { id: "yearsExperience", icon: Award, value: 20, suffix: "", translationKey: "yearsExperience" },
    { id: "generations", icon: Users, value: 4, suffix: "", translationKey: "generations" },
    { id: "countries", icon: Globe, value: 25, suffix: "+", translationKey: "countries" },
    { id: "microclimates", icon: CloudSun, value: 300, suffix: "+", translationKey: "microclimates" },
    { id: "hectares", icon: MapPinned, value: 27000, suffix: "+", translationKey: "hectares" },
]
