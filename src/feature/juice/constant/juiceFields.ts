import { z } from "zod"
import * as schemas from "../schema/juice.schema"

export type JuiceField = { name: string; kind?: "number" | "client" | "reference" | "unit" | "image"; step?: string; optional?: boolean; nullable?: boolean; maxLength?: number }
const text = (name: string, maxLength = 120): JuiceField => ({ name, maxLength })
const number = (name: string, step = "0.000000000001"): JuiceField => ({ name, kind: "number", step })
export const juiceFields: JuiceField[] = [text("code", 60), text("displayName"), { name: "clientId", kind: "client" }, number("pricePerPound"), { name: "image", kind: "image", optional: true }]
const rawMaterialFields: JuiceField[] = [text("code", 60), text("displayName"), { name: "purchaseUnit", kind: "unit" }, number("yieldPoundsPerLiter", "0.000001"), number("costPerUnit")]
const spiceMaterialFields = [text("code", 60), text("displayName"), number("costPerGram")]
const presentationFields = [text("displayLabel"), number("mlPerBottle", "0.001"), number("bottlesPerCase", "1"), number("casesPerPallet", "1"), number("boxUnitCost"), number("stickerUnitCost"), number("stickerQuantityPerCase", "0.000001"), number("secondStickerUnitCost"), number("secondStickerQuantityPerCase", "0.000001"), number("bottleUnitCost"), number("capUnitCost"), number("marginPerCase", "0.0001")]
// Pallets are whole units, rates are fractions with six decimals and every other constant is money (four decimals).
function constantFieldStep(name: string): string {
    if (name === "palletsPerContainer") return "1"
    if (name.endsWith("Rate")) return "0.000001"
    return "0.0001"
}
export const constantFields = Object.keys(schemas.constantsInputSchema.shape).map(name => number(name, constantFieldStep(name)))
const overrideFields: JuiceField[] = [{ name: "clientId", kind: "client" }, ...constantFields.map(field => ({ ...field, nullable: true, optional: true }))]

export type JuiceResource = { path: string; title: string; fields: JuiceField[]; create: z.ZodType; update: z.ZodType; response: z.ZodType<schemas.JuiceRow>; columns: string[]; referenceName?: string; referencePath?: string; referenceSchema?: z.ZodType<schemas.JuiceRow> }
export const rawMaterialsResource: JuiceResource = { path: "/admin/juices/raw-materials", title: "rawMaterials", fields: rawMaterialFields, create: schemas.rawMaterialInputSchema, update: schemas.rawMaterialInputSchema, response: schemas.rawMaterialResponseSchema, columns: ["code", "displayName", "purchaseUnit", "yieldPoundsPerLiter", "costPerUnit", "costPerLiter"] }
export const spiceMaterialsResource: JuiceResource = { path: "/admin/juices/spice-materials", title: "spiceMaterials", fields: spiceMaterialFields, create: schemas.spiceMaterialInputSchema, update: schemas.spiceMaterialInputSchema, response: schemas.spiceMaterialResponseSchema, columns: ["code", "displayName", "costPerGram"] }
export const presentationsResource: JuiceResource = { path: "/admin/juices/presentations", title: "presentations", fields: presentationFields, create: schemas.presentationInputSchema, update: schemas.presentationUpdateSchema, response: schemas.presentationResponseSchema, columns: ["displayLabel", "mlPerBottle", "bottlesPerCase", "casesPerPallet", "marginPerCase"] }
export const mixResource: JuiceResource = { path: "/admin/juices/mix", title: "recipe", fields: [{ name: "rawMaterialId", kind: "reference" }, number("percentage", "0.000001")], create: schemas.mixInputSchema, update: schemas.mixUpdateSchema, response: schemas.mixResponseSchema, columns: ["rawMaterialId", "percentage"], referenceName: "rawMaterialId", referencePath: rawMaterialsResource.path, referenceSchema: schemas.rawMaterialResponseSchema }
export const spicesResource: JuiceResource = { path: "/admin/juices/spices", title: "spices", fields: [{ name: "spiceMaterialId", kind: "reference" }, number("gramsPerLiter", "0.000001")], create: schemas.spiceInputSchema, update: schemas.spiceUpdateSchema, response: schemas.spiceResponseSchema, columns: ["spiceMaterialId", "gramsPerLiter"], referenceName: "spiceMaterialId", referencePath: spiceMaterialsResource.path, referenceSchema: schemas.spiceMaterialResponseSchema }
export const overridesResource: JuiceResource = { path: "/admin/juice-config/client-overrides", title: "overrides", fields: overrideFields, create: schemas.overrideInputSchema, update: schemas.overrideUpdateSchema, response: schemas.overrideResponseSchema, columns: ["clientId"] }
