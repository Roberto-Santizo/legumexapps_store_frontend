import { View, Text, Svg, Path } from "@react-pdf/renderer"
import { useTranslation } from "react-i18next"
import { quotePdfStyles as styles, VERDE_PROFUNDO } from "./quotePdfDocument.styles"
import { buildPdfPackagingMaterials } from "./quotePdfPackaging"
import type { PdfPackagingKind, PdfPackagingSnapshot } from "./quotePdfPackaging"

const iconPaths: Record<PdfPackagingKind, string[]> = {
    unit: ["M7 3h10l-1 4 3 13H5L8 7Z", "M8 7h8M8 16h8"],
    intermediate: ["M5 3h14l-1 4 2 13H4L6 7Z", "M6 7h12M8 11h8v5H8Z"],
    box: ["M3 7l9-4 9 4v10l-9 4-9-4Z", "M3 7l9 4 9-4M12 11v10M8 5l9 4"],
    pallet: ["M3 6h18v4H3ZM3 15h18v3H3Z", "M5 10v5M12 10v5M19 10v5M6 18v3M18 18v3M8 6v4M16 6v4"],
    corner: ["M5 3h5v11h11v5H5Z", "M8 6v11h10"],
    stretch: ["M8 5c0-2 8-2 8 0v13c0 3-8 3-8 0Z", "M8 5c0 3 8 3 8 0M16 8h4v12h-7M8 15c0 3 8 3 8 0"],
    other: ["M4 7l8-4 8 4v10l-8 4-8-4Z", "M4 7l8 4 8-4M12 11v10M2 21h20"],
}

function PackagingIcon({ kind }: Readonly<{ kind: PdfPackagingKind }>) {
    return <Svg width={22} height={22} viewBox="0 0 24 24">
        {iconPaths[kind].map(path => <Path key={path} d={path} fill="none" stroke={VERDE_PROFUNDO} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />)}
    </Svg>
}

export function QuotePdfPackaging({ breakdown }: Readonly<{ breakdown: PdfPackagingSnapshot }>) {
    const { t } = useTranslation()
    const materials = buildPdfPackagingMaterials(breakdown)
    if (!materials.length) return null
    const basis = materials.length < 3 ? "45%" : "30%"
    return <View style={styles.packagingConfigSection}>
        <View style={styles.packagingConfigTitleRow}>
            <View style={styles.packagingConfigTitleMark} />
            <Text style={[styles.packagingConfigTitle, { color: VERDE_PROFUNDO }]}>{t("quote.pdf.document.packaging.title")}</Text>
        </View>
        <View style={styles.packagingCards}>
            {materials.map((material, index) => <View key={`${material.kind}-${index}`} style={[styles.packagingCard, { flexBasis: basis }]} wrap={false}>
                <View style={styles.packagingIcon}><PackagingIcon kind={material.kind} /></View>
                <View style={styles.packagingCardText}>
                    <Text style={styles.packagingMaterialType}>{t(`quote.pdf.document.packaging.${material.kind}`)}</Text>
                    <Text style={styles.packagingMaterialName} hyphenationCallback={word => word.length > 20 ? Array.from(word) : [word]}>{material.name}</Text>
                </View>
            </View>)}
        </View>
    </View>
}
