export type PackagingConfigLevel = "unit" | "intermediate" | "pallet"

export type PackagingConfigGroup = {
    group: string
    material: string
}

export type PackagingConfigLevelSummary = {
    level: PackagingConfigLevel
    // Número fijo del nivel (1/2/3) -- se mantiene aunque otro nivel falte, igual que los badges
    // numerados de los niveles en el wizard.
    number: number
    fixed: string[]
    groups: PackagingConfigGroup[]
}

type MaterialLine = { displayName: string; optionGroup: string | null }

// Lo único que el helper lee de un snapshot (Quote.breakdown o el de un borrador).
export type PackagingMaterialsSnapshot = {
    unitMaterials?: MaterialLine[]
    intermediateMaterials?: MaterialLine[]
    palletMaterials?: MaterialLine[]
}

// Configuración de empaque de una línea cotizada, SOLO nombres (nunca costos): el snapshot ya
// trae exactamente las filas costeadas -- las fijas (optionGroup null) + una por grupo (la elegida
// por el cliente o el default), ver quote.service.ts::resolveMaterialsForQuote en el backend.
// Función pura: la usan el PDF y el seguimiento de cotizaciones sin finalizar (feature/quoteDraft),
// que solo recibe los tres arrays de materiales -- por eso el parámetro pide solo esos campos.
// Niveles ausentes (cotizaciones viejas sin unitMaterials/intermediateMaterials) o sin filas se
// omiten.
export function buildPackagingConfiguration(
    breakdown: PackagingMaterialsSnapshot,
): PackagingConfigLevelSummary[] {
    const levels: { level: PackagingConfigLevel; number: number; lines: MaterialLine[] | undefined }[] = [
        { level: "unit", number: 1, lines: breakdown.unitMaterials },
        { level: "intermediate", number: 2, lines: breakdown.intermediateMaterials },
        { level: "pallet", number: 3, lines: breakdown.palletMaterials },
    ]

    return levels
        .filter(({ lines }) => lines && lines.length > 0)
        .map(({ level, number, lines = [] }) => ({
            level,
            number,
            fixed: lines.filter((line) => line.optionGroup === null).map((line) => line.displayName),
            groups: lines
                .filter((line): line is MaterialLine & { optionGroup: string } => line.optionGroup !== null)
                .map((line) => ({ group: line.optionGroup, material: line.displayName })),
        }))
}
