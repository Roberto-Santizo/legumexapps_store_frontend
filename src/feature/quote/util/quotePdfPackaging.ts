import { packagingQuantity, type PackagingQuantityInput } from "./quotePackagingQuantity"
import { packagingName } from "@/shared/i18n/packagingName"
export type PdfPackagingKind = "unit" | "intermediate" | "box" | "pallet" | "corner" | "stretch" | "other"
type Material = PackagingQuantityInput & { displayName: string; displayNameEn?: string | null; materialType?: string | null }
export type PdfPackagingSnapshot = { unitMaterials?: Material[]; intermediateMaterials?: Material[]; palletMaterials?: Material[] }

const palletTypes: Record<string, PdfPackagingKind> = {
    CAJA: "box", ESQUINERO: "corner", TARIMA: "pallet", STRETCH: "stretch", "OTRO PALETIZACIÓN": "other",
}

// Presentation only. Never infer type/consumption from material names or groups.
export function buildPdfPackagingMaterials(snapshot: PdfPackagingSnapshot, language?: string) {
    const quantity = (material: Material) => {
        const value = packagingQuantity(material)
        return value === null ? {} : { quantity: value }
    }
    return [
        ...(snapshot.unitMaterials ?? []).map(material => ({ name: packagingName(material, language), kind: "unit" as PdfPackagingKind, ...quantity(material) })),
        ...(snapshot.intermediateMaterials ?? []).map(material => ({ name: packagingName(material, language), kind: "intermediate" as PdfPackagingKind, ...quantity(material) })),
        ...(snapshot.palletMaterials ?? []).map(material => ({ name: packagingName(material, language), kind: palletTypes[material.materialType ?? ""] ?? "other", ...quantity(material) })),
    ]
}
