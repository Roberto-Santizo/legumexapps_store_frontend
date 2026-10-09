import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { getPublicSiteImagesAPI } from "@/feature/siteImage/api/siteImage.api"
import type { SiteImageSlot } from "@/feature/siteImage/schema/siteImage.schema"

type SiteImagesResponse = Awaited<ReturnType<typeof getPublicSiteImagesAPI>>

// Última respuesta conocida, guardada en el navegador: en visitas siguientes las fotos subidas
// se pintan al instante (sin esperar al backend) y el query las refresca en segundo plano.
const CACHE_KEY = "legumex.siteImages"

function readCachedSiteImages(): SiteImagesResponse | undefined {
    try {
        const raw = localStorage.getItem(CACHE_KEY)
        return raw ? (JSON.parse(raw) as SiteImagesResponse) : undefined
    } catch {
        return undefined
    }
}

function writeCachedSiteImages(response: SiteImagesResponse) {
    try {
        if (response) localStorage.setItem(CACHE_KEY, JSON.stringify(response))
    } catch {
        // Sin almacenamiento disponible (modo privado, etc.): simplemente no hay caché.
    }
}

// Un solo query key compartido entre todos los componentes de la landing que necesitan una
// imagen reemplazable -- react-query lo deduplica en un solo request aunque varios componentes
// lo llamen a la vez (hero, cada fila de línea de producto, el carrusel). La landing NO tiene
// imágenes por defecto: un slot sin foto subida (o mientras la respuesta todavía no llega) se
// muestra como un espacio vacío, nunca como una foto de stock que luego "salta" a la real.
export function useSiteImages(): Partial<Record<SiteImageSlot, string>> {
    const query = useQuery({
        queryKey: ["site-images", "public"],
        queryFn: async () => {
            const response = await getPublicSiteImagesAPI()
            writeCachedSiteImages(response)
            return response
        },
        initialData: readCachedSiteImages,
        // La caché local cuenta como vieja: siempre se vuelve a pedir al montar.
        initialDataUpdatedAt: 0,
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
