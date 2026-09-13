import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiListResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseSiteImageSchema } from "@/feature/siteImage/schema/siteImage.schema"

const siteImageListResponseSchema = apiListResponseSchema(responseSiteImageSchema)

// Público, sin auth -- lo consume la landing (ver useSiteImages.ts) para saber qué slots tienen
// imagen subida desde el admin. Slots sin fila no vienen en la respuesta.
export async function getPublicSiteImagesAPI() {
    try {
        const { data } = await api.get("/site-images")
        return siteImageListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
