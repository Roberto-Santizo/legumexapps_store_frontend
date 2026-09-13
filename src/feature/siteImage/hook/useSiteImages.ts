import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { getPublicSiteImagesAPI } from "@/feature/siteImage/api/siteImage.api"
import type { SiteImageSlot } from "@/feature/siteImage/schema/siteImage.schema"

// Un solo query key compartido entre todos los componentes de la landing que necesitan una
// imagen reemplazable -- react-query lo deduplica en un solo request aunque varios componentes
// lo llamen a la vez (hero, cada fila de línea de producto, el carrusel). Si falla (offline,
// etc.) simplemente no hay overrides y cada componente cae a su imagen bundled por defecto --
// nunca debe romper la landing.
export function useSiteImages(): Partial<Record<SiteImageSlot, string>> {
    const query = useQuery({
        queryKey: ["site-images", "public"],
        queryFn: getPublicSiteImagesAPI,
        staleTime: 5 * 60 * 1000,
        retry: false,
    })

    return useMemo(() => {
        const overrides: Partial<Record<SiteImageSlot, string>> = {}
        for (const item of query.data?.data ?? []) {
            if (item.imageUrl) overrides[item.slotKey] = item.imageUrl
        }
        return overrides
    }, [query.data])
}
