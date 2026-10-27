import { catalogInputSchema } from "../schema/catalogQuote.schema"
import type { CatalogDiscovery } from "../schema/catalogQuote.schema"
import type { CatalogConfiguration } from "../schema/catalogQuote.schema"
import type { MaterialGroup, MaterialLevel } from "@/feature/quote/component/quoteMaterialGroups.component"

export function exactMix(percentages: Record<number, string>) {
    const lines = Object.entries(percentages).filter(([, value]) => value.trim() !== "" && Number(value) !== 0)
    if (!lines.length || lines.some(([, value]) => !/^\d+(\.\d{1,2})?$/.test(value) || Number(value) <= 0 || Number(value) > 100)) return false
    return lines.reduce((sum, [, value]) => sum + Math.round(Number(value) * 100), 0) === 10000
}
// Single: exactly one raw material at 100%. Blend: two or more adding up to 100%. The backend re-validates.
export function validComposition(mode: "single" | "blend" | null | undefined, percentages: Record<number, string>) {
    const lines = Object.values(percentages).filter(value => value.trim() !== "" && Number(value) !== 0).length
    return exactMix(percentages) && (mode === "single" ? lines === 1 : lines >= 2)
}
// Required "all" groups are always included by the server (shown read-only, never sent); the rest become choosers.
export function catalogMaterialGroups(configuration: CatalogConfiguration | undefined, choices: Record<string, number>): MaterialGroup[] {
    if (!configuration) return []
    return (["unit", "intermediate", "pallet"] as MaterialLevel[]).flatMap(level => configuration.packaging[level].groups.map(group => {
        const key = `${level}:catalog:${group.packagingGroupId ?? group.key}`
        const chosen = group.options.find(option => option.packagingId === choices[key]) ?? (group.isRequired && group.selectionMode === "one" && group.options.length === 1 ? group.options[0] : undefined)
        const selectedIds = group.selectionMode === "all" ? (chosen ? group.options.map(option => option.id) : []) : chosen ? [chosen.id] : []
        return { key, level, group: group.group, groupId: group.groupId, isRequired: group.isRequired, selectionMode: group.selectionMode, selectedIds, options: group.options.map(option => ({ ...option, unitCost: 0 })), selectedId: chosen?.id }
    }))
}
// Pallet kit types with several materials (e.g. wooden or cardboard corner boards) become a required chooser;
// a type with one material is simply included. The quantity is never chosen.
const KIT_KEY = "pallet:kit:"
export function palletKitGroups(catalog: CatalogDiscovery | undefined, choices: Record<string, number>): MaterialGroup[] {
    return (catalog?.palletKit ?? []).filter(part => part.options.length > 1).map(part => {
        const key = `${KIT_KEY}${part.type}`
        const chosen = part.options.find(option => option.packagingId === choices[key])
        return { key, level: "pallet" as const, group: part.group, isRequired: true, selectionMode: "one" as const, selectedIds: chosen ? [chosen.id] : [], options: part.options.map(option => ({ ...option, unitCost: 0 })), selectedId: chosen?.id }
    })
}
export function emptyCatalogSelection() {
    return { categoryId: null as number | null, subCategoryId: null as number | null, ingredientType: "" as string,
        percentages: {} as Record<number, string>, configurationId: null as number | null, choices: {} as Record<string, number>, pallets: "1" }
}
export type CatalogSelection = ReturnType<typeof emptyCatalogSelection>
export function changeCatalogSelection(state: CatalogSelection, field: "categoryId" | "subCategoryId" | "ingredientType" | "configurationId", value: number | string): CatalogSelection {
    if (field === "categoryId") return { ...emptyCatalogSelection(), categoryId: Number(value), choices: state.choices }
    if (field === "subCategoryId") return { ...emptyCatalogSelection(), categoryId: state.categoryId, subCategoryId: Number(value), choices: state.choices }
    if (field === "ingredientType") return { ...state, ingredientType: String(value), percentages: {} }
    return { ...state, configurationId: Number(value) }
}

export function resolveCatalogSelection(catalog: CatalogDiscovery | undefined, state: CatalogSelection) {
    const category = catalog?.categories.find(row => row.id === state.categoryId)
    const subCategory = category?.subCategories.find(row => row.id === state.subCategoryId)
    const configurations = subCategory?.configurations ?? []
    // A single presentation is preselected, as with a single SKU in fixed products.
    const configuration = configurations.find(row => row.id === state.configurationId) ?? (configurations.length === 1 ? configurations[0] : undefined)
    const compositionMode = subCategory?.compositionMode ?? null
    const types = [...new Set(subCategory?.rawMaterials.map(row => row.ingredientType) ?? [])]
    const effectiveType = types.length === 1 ? types[0] : state.ingredientType
    const materials = subCategory?.rawMaterials.filter(row => row.ingredientType === effectiveType) ?? []
    const kitGroups = palletKitGroups(catalog, state.choices)
    const groups = [...catalogMaterialGroups(configuration, state.choices), ...kitGroups]
    const parse = catalogInputSchema.safeParse({
        categoryId: state.categoryId, subCategoryId: state.subCategoryId, configurationId: configuration?.id,
        ingredientType: effectiveType, requestedPallets: Number(state.pallets),
        rawMaterialMix: materials.map(row => ({ rawMaterialId: row.rawMaterialId, percentage: Number(state.percentages[row.rawMaterialId]) })).filter(row => row.percentage > 0),
        configurationOrigin: "generic_configuration", packagingSelections: groups.filter(group => group.groupId != null && group.selectedIds?.length).map(group => ({ groupId: group.groupId, optionIds: group.selectedIds })),
        palletKitSelections: kitGroups.filter(group => group.selectedId != null).map(group => ({ type: group.key.slice(KIT_KEY.length), packagingId: state.choices[group.key] })),
    })
    const packagingComplete = !!configuration && !configuration.configurationIssue && groups.every(group => group.isRequired !== true || Boolean(group.selectedIds?.length))
    const input = parse.success && validComposition(compositionMode, state.percentages) && packagingComplete ? parse.data : null
    return { category, subCategory, configuration, compositionMode, types, effectiveType, materials, groups, input }
}

// Keep only compatible material identities; association IDs are resolved for the new profile.
export function reconcileCatalogChoices(configuration: CatalogConfiguration | undefined, choices: Record<string,number>) {
    if (!configuration) return choices
    const groups = catalogMaterialGroups(configuration,choices)
    // Pallet kit choices do not depend on the presentation, so they are kept.
    return Object.fromEntries([...groups.filter(group => group.selectedId != null && group.options.some(option => option.packagingId === choices[group.key]))
        .map(group => [group.key,choices[group.key]]), ...Object.entries(choices).filter(([key]) => key.startsWith(KIT_KEY))])
}
