export type BilingualPackagingName = { displayName: string; displayNameEn?: string | null }

// Catalog content, not i18next keys. Historical snapshots may lack English.
export function packagingName(material: BilingualPackagingName | null | undefined, language?: string): string {
    if (!material) return ""
    return language?.toLowerCase().startsWith("en") && material.displayNameEn?.trim()
        ? material.displayNameEn
        : material.displayName
}
