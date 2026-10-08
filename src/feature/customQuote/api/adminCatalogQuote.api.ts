import api from "@/shared/api/api"
import { catalogDiscoverySchema } from "../schema/catalogQuote.schema"
import type { CatalogInput } from "../schema/catalogQuote.schema"
import { customQuoteCalculationSchema } from "../schema/customQuote.schema"

export async function discoverAdminCatalogAPI() {
    const { data } = await api.get("/admin/quotes/catalog-configurations")
    return catalogDiscoverySchema.parse(data.data)
}

export async function previewAdminCatalogAPI(input: CatalogInput) {
    const { data } = await api.post("/admin/quotes/catalog-preview", input)
    return customQuoteCalculationSchema.parse(data.data)
}
