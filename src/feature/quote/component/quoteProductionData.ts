import type { QuoteLine } from "../schema/quote.schema"

export type ProductionMaterial = { catalog: "raw" | "ingredient" | "packaging"; code?: string; name: string; group?: string | null; percentage?: number; perUnitGrams?: number; quantity: number | null; unit: "kg" | "units" | string }
export function productionMaterials(line: QuoteLine) {
    const { breakdown } = line
    const raw: ProductionMaterial[] = breakdown.rawMaterials.map(row => ({
        catalog: "raw", code: row.code, name: row.displayName, percentage: row.percentage, perUnitGrams: row.gramsPerUnit,
        quantity: row.gramsPerUnit == null ? null : row.gramsPerUnit * line.totalUnits / 1000, unit: "kg",
    }))
    const ingredients: ProductionMaterial[] = (breakdown.ingredients ?? []).map(row => ({ catalog: "ingredient", code: row.code, name: row.displayName, perUnitGrams: row.gramsPerUnit, quantity: row.gramsPerUnit * line.totalUnits / 1000, unit: "kg" }))
    const unit: ProductionMaterial[] = (breakdown.unitMaterials ?? []).map(row => ({ catalog: "packaging", code: row.code, name: row.displayName, group: row.optionGroup, quantity: row.quantityPerUnit * line.totalUnits, unit: "units" }))
    const intermediate: ProductionMaterial[] = (breakdown.intermediateMaterials ?? []).map(row => ({ catalog: "packaging", code: row.code, name: row.displayName, group: row.optionGroup, quantity: row.packagesNeeded, unit: "units" }))
    const pallet: ProductionMaterial[] = breakdown.palletMaterials.map(row => ({ catalog: "packaging", code: row.code, name: row.displayName, group: row.optionGroup, quantity: row.quantityPerPallet * line.requestedPallets, unit: "units" }))
    return { raw, ingredients, unit, intermediate, pallet }
}

export function consolidateProductionMaterials(lines: QuoteLine[]): ProductionMaterial[] {
    const totals = new Map<string, ProductionMaterial>()
    for (const line of lines) for (const row of Object.values(productionMaterials(line)).flat()) {
        // Missing codes are deliberately not consolidated: equal names need not mean equal materials.
        const key = row.code ? `${row.catalog}:${row.code}:${row.unit}` : `unknown:${totals.size}`
        const existing = totals.get(key)
        if (existing) existing.quantity = existing.quantity == null || row.quantity == null ? null : existing.quantity + row.quantity
        else totals.set(key, { ...row, percentage: undefined, perUnitGrams: undefined, group: undefined })
    }
    return [...totals.values()]
}
