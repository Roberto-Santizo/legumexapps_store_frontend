import { z } from "zod"
import { customQuoteCalculationSchema } from "./customQuote.schema"

const material = z.object({ id: z.number(), packagingId: z.number(), displayName: z.string(), isDefault: z.boolean() })
const level = z.object({ fixed: z.array(material), groups: z.array(z.object({ key: z.string(), group: z.string(), options: z.array(material) })) })
export const catalogConfigurationSchema = z.object({ id: z.number(), fingerprint: z.string(), presentationId: z.number(), displayLabel: z.string(), netWeightGrams: z.number(), bagsPerBox: z.number(), boxesPerPallet: z.number(), unitsPerIntermediatePackage: z.number().nullable(), packaging: z.object({ unit: level, intermediate: level, pallet: level }) })
export const catalogDiscoverySchema = z.object({ categories: z.array(z.object({ id: z.number(), displayName: z.string(), subCategories: z.array(z.object({ id: z.number(), displayName: z.string(), rawMaterials: z.array(z.object({ rawMaterialId: z.number(), displayName: z.string(), ingredientType: z.enum(["fruit", "vegetable", "pulp", "other"]), isOrganic: z.boolean() })), configurations: z.array(catalogConfigurationSchema) })) })) })
export const catalogInputSchema = z.strictObject({ categoryId: z.number().int().positive(), subCategoryId: z.number().int().positive(), configurationId: z.number().int().positive(), ingredientType: z.enum(["fruit", "vegetable", "pulp", "other"]), isOrganic: z.boolean(), requestedPallets: z.number().int().positive().max(100000), rawMaterialMix: z.array(z.object({ rawMaterialId: z.number().int().positive(), percentage: z.number().positive().max(100).multipleOf(0.01) })).min(1).max(100), selectedUnitMaterialIds: z.array(z.number()), selectedIntermediateMaterialIds: z.array(z.number()), selectedPalletMaterialIds: z.array(z.number()) })
export const catalogPreviewSchema = customQuoteCalculationSchema.extend({ previewToken: z.string() })
export const catalogConfirmedSchema = customQuoteCalculationSchema.extend({ id: z.number(), status: z.string(), createdAt: z.coerce.date() })
export type CatalogDiscovery = z.infer<typeof catalogDiscoverySchema>
export type CatalogInput = z.infer<typeof catalogInputSchema>
export type CatalogConfiguration = z.infer<typeof catalogConfigurationSchema>
export type CatalogPreview = z.infer<typeof catalogPreviewSchema>
export type CatalogConfirmed = z.infer<typeof catalogConfirmedSchema>
