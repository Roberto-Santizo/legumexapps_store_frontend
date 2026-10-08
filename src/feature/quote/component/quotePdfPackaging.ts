export type PdfPackagingKind = "unit" | "intermediate" | "box" | "pallet" | "corner" | "stretch" | "other"
type Material = { displayName: string; materialType?: string | null }
export type PdfPackagingSnapshot = { unitMaterials?: Material[]; intermediateMaterials?: Material[]; palletMaterials?: Material[] }

const palletTypes: Record<string, PdfPackagingKind> = {
    CAJA: "box", ESQUINERO: "corner", TARIMA: "pallet", STRETCH: "stretch", "OTRO PALETIZACIÓN": "other",
}

// Presentation only. Never infer type/consumption from material names or groups.
export function buildPdfPackagingMaterials(snapshot: PdfPackagingSnapshot) {
    return [
        ...(snapshot.unitMaterials ?? []).map(material => ({ name: material.displayName, kind: "unit" as PdfPackagingKind })),
        ...(snapshot.intermediateMaterials ?? []).map(material => ({ name: material.displayName, kind: "intermediate" as PdfPackagingKind })),
        ...(snapshot.palletMaterials ?? []).map(material => ({ name: material.displayName, kind: palletTypes[material.materialType ?? ""] ?? "other" })),
    ]
}
