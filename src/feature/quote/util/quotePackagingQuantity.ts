export type PackagingQuantityInput = {
    quantityPerUnit?: number
    totalUnits?: number
    packagesNeeded?: number
    quantityPerPallet?: number
    requestedPallets?: number
}

// Display the saved consumption only; historical rows without quantities remain unknown.
export function packagingQuantity(row: PackagingQuantityInput): number | null {
    const valid = (value: number | undefined): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0
    if (valid(row.packagesNeeded)) return row.packagesNeeded
    if (valid(row.quantityPerUnit) && valid(row.totalUnits)) return row.quantityPerUnit * row.totalUnits
    if (valid(row.quantityPerPallet) && valid(row.requestedPallets)) return row.quantityPerPallet * row.requestedPallets
    return null
}
