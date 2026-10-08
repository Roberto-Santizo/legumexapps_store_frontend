import { catalogInputSchema } from "../schema/catalogQuote.schema"
import type { CatalogDiscovery } from "../schema/catalogQuote.schema"
import type { CatalogConfiguration } from "../schema/catalogQuote.schema"
import type { MaterialGroup, MaterialLevel } from "@/feature/quote/component/quoteMaterialGroups.component"

export function exactMix(percentages: Record<number, string>) {
    const lines = Object.entries(percentages).filter(([, value]) => value.trim() !== "" && Number(value) !== 0)
    if (!lines.length || lines.some(([, value]) => !/^\d+(\.\d{1,2})?$/.test(value) || Number(value) <= 0 || Number(value) > 100)) return false
    return lines.reduce((sum, [, value]) => sum + Math.round(Number(value) * 100), 0) === 10000
}
export function catalogMaterialGroups(configuration: CatalogConfiguration | undefined, choices: Record<string, number>): MaterialGroup[] {
    if (!configuration) return []
    return (["unit", "intermediate", "pallet"] as MaterialLevel[]).flatMap(level => configuration.packaging[level].groups.map(group => {
        const key = `${level}:${group.key}`
        const chosen = group.options.find(option => option.id === choices[key]) ?? group.options.find(option => option.isDefault)
        return { key, level, group: group.group, options: group.options.map(option => ({ ...option, unitCost: 0 })), selectedId: chosen?.id }
    }))
}
export function emptyCatalogSelection() {
    return { categoryId: null as number | null, subCategoryId: null as number | null, ingredientType: "" as string, isOrganic: false,
        percentages: {} as Record<number, string>, configurationId: null as number | null, choices: {} as Record<string, number>, pallets: "1" }
}
export type CatalogSelection = ReturnType<typeof emptyCatalogSelection>
export function changeCatalogSelection(state: CatalogSelection, field: "categoryId" | "subCategoryId" | "ingredientType" | "isOrganic" | "configurationId", value: number | string | boolean): CatalogSelection {
    if (field === "categoryId") return { ...emptyCatalogSelection(), categoryId: Number(value) }
    if (field === "subCategoryId") return { ...emptyCatalogSelection(), categoryId: state.categoryId, subCategoryId: Number(value) }
    if (field === "ingredientType") return { ...state, ingredientType: String(value), percentages: {}, configurationId: null, choices: {} }
    if (field === "isOrganic") return { ...state, isOrganic: Boolean(value), percentages: {}, configurationId: null, choices: {} }
    return { ...state, configurationId: Number(value), choices: {} }
}

export function resolveCatalogSelection(catalog: CatalogDiscovery | undefined, state: CatalogSelection) {
    const category = catalog?.categories.find(row => row.id === state.categoryId)
    const subCategory = category?.subCategories.find(row => row.id === state.subCategoryId)
    const configuration = subCategory?.configurations.find(row => row.id === state.configurationId)
    const types = [...new Set(subCategory?.rawMaterials.map(row => row.ingredientType) ?? [])]
    const effectiveType = types.length === 1 ? types[0] : state.ingredientType
    const materials = subCategory?.rawMaterials.filter(row => row.ingredientType === effectiveType && row.isOrganic === state.isOrganic) ?? []
    const groups = catalogMaterialGroups(configuration, state.choices)
    const parse = catalogInputSchema.safeParse({
        categoryId: state.categoryId, subCategoryId: state.subCategoryId, configurationId: state.configurationId,
        ingredientType: effectiveType, isOrganic: state.isOrganic, requestedPallets: Number(state.pallets),
        rawMaterialMix: materials.map(row => ({ rawMaterialId: row.rawMaterialId, percentage: Number(state.percentages[row.rawMaterialId]) })).filter(row => row.percentage > 0),
        selectedUnitMaterialIds: groups.filter(row => row.level === "unit").map(row => row.selectedId),
        selectedIntermediateMaterialIds: groups.filter(row => row.level === "intermediate").map(row => row.selectedId),
        selectedPalletMaterialIds: groups.filter(row => row.level === "pallet").map(row => row.selectedId),
    })
    const input = parse.success && exactMix(state.percentages) ? parse.data : null
    return { category, subCategory, configuration, types, effectiveType, materials, groups, input }
}
