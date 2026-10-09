import salespersonApi from "@/shared/api/salespersonApi"
import { catalogDiscoverySchema, catalogPreviewSchema, catalogConfirmedSchema } from "../schema/catalogQuote.schema"
import type { CatalogInput } from "../schema/catalogQuote.schema"

// Errors remain rejected: review/confirm must never treat a failed request as success.
export async function discoverCatalogAPI() {
    const { data } = await salespersonApi.get("/custom-quotes/configurations")
    return catalogDiscoverySchema.parse(data.data)
}
export async function previewCatalogAPI(input: CatalogInput) {
    const { data } = await salespersonApi.post("/custom-quotes/catalog-preview", input)
    return catalogPreviewSchema.parse(data.data)
}
export async function confirmCatalogAPI(request: { input: CatalogInput; previewToken: string; confirmationKey: string; order?: { id: string; clientName: string } }) {
    const { data } = await salespersonApi.post("/custom-quotes/catalog-confirm", request)
    return catalogConfirmedSchema.parse(data.data)
}
