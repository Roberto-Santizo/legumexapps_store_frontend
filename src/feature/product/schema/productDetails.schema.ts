import { z } from "zod"

const number = z.coerce.number().finite()
const reference = z.object({ id: z.number().int(), displayName: z.string() })
const status = z.object({ id: z.number().int(), isActive: z.boolean() })
const costUnit = z.object({ unitCode: z.string(), displayName: z.string() }).nullable()
const material = status.extend({ displayName: z.string(), code: z.string().nullable(), costPerUnit: number.nullable(), costUnit })
const packaging = status.extend({ displayName: z.string(), displayNameEn: z.string().nullable().optional(), code: z.string().nullable(), packagingRole: z.enum(["unit", "intermediate", "pallet"]), unitCost: number.nullable() }).nullable()
const association = status.extend({ optionGroup: z.string().nullable(), isDefault: z.boolean() })

export const productDetailsSchema = status.extend({
    displayName: z.string(), isOrganic: z.boolean(), imageUrl: z.string().nullable(), additionalCostPerUnit: number.nullable(),
    client: z.object({ id: z.number().int(), name: z.string(), isActive: z.boolean() }).nullable(),
    parentSubCategory: reference.extend({ parentCategory: reference.nullable() }).nullable(),
    productRawMaterials: z.array(status.extend({ percentage: number.nullable(), usedRawMaterial: material.extend({ ingredientType: z.string() }).nullable() })),
    productIngredients: z.array(status.extend({ grams: number, referenceNetWeightGrams: number, usedIngredient: material.nullable() })),
    productVariants: z.array(status.extend({
        skuCode: z.string(), boxesPerPallet: number.nullable(), bagsPerBox: number.nullable(), unitsPerIntermediatePackage: number.nullable(),
        sizePresentation: status.extend({ displayLabel: z.string(), netWeightGrams: number.nullable() }).nullable(),
        unitMaterials: z.array(association.extend({ quantityPerUnit: number, usedUnitMaterial: packaging, optionGroupCatalog: reference.nullable() })),
        intermediateMaterials: z.array(association.extend({ usedIntermediateMaterial: packaging })),
        palletMaterials: z.array(association.extend({ quantityValue: number.nullable(), quantityBasis: z.enum(["per_box", "per_pallet"]), usedPalletMaterial: packaging, packagingGroup: reference.nullable() })),
    })),
})

export type ProductDetails = z.infer<typeof productDetailsSchema>
export type ProductDetailsVariant = ProductDetails["productVariants"][number]
export type ProductDetailsPackaging = NonNullable<ProductDetailsVariant["unitMaterials"][number]["usedUnitMaterial"]>
