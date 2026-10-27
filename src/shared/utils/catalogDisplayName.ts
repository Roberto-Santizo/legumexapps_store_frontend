type TranslatedCatalog = {
    displayName: string
    translations: { language: string; displayName: string }[]
}

export function catalogDisplayName(row: TranslatedCatalog, language: string): string {
    const locale = language.toLowerCase().split("-")[0]
    return locale === "es" ? row.displayName
        : row.translations.find(translation => translation.language === locale)?.displayName.trim() || row.displayName
}
