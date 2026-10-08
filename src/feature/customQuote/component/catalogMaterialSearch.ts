// Search only the compatible catalog supplied by the wizard; never expand it.
export function normalizeMaterialSearch(value: string): string {
    return value.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase()
}

export function searchCatalogMaterials<T extends { displayName: string }>(materials: readonly T[], search: string): T[] {
    const query = normalizeMaterialSearch(search)
    return materials.filter(row => normalizeMaterialSearch(row.displayName).includes(query))
}
