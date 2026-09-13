import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiListResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseSiteImageSchema } from "@/feature/siteImage/schema/siteImage.schema"
import type { SiteImageSlot, UpdateSiteImageInput } from "@/feature/siteImage/schema/siteImage.schema"

const siteImageListResponseSchema = apiListResponseSchema(responseSiteImageSchema)
const siteImageMutationResponseSchema = apiMutationResponseSchema(responseSiteImageSchema)

// Siempre trae las 8 filas (el backend arma las que faltan al vuelo) -- ver
// siteImage.service.ts::listSiteImagesForAdmin.
export async function getSiteImagesAPI() {
    try {
        const { data } = await api.get("/admin/site-images")
        return siteImageListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateSiteImageAPI(slotKey: SiteImageSlot, formData: UpdateSiteImageInput) {
    try {
        const { data } = await api.put(`/admin/site-images/${slotKey}`, formData)
        return siteImageMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
