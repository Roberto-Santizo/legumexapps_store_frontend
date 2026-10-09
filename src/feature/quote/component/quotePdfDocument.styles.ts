import { Font, StyleSheet } from "@react-pdf/renderer"

// Sin guiones de corte automáticos ("disponibil-idad"): las palabras pasan completas a la línea siguiente.
// Los nombres de material muy largos tienen su propio hyphenationCallback en quotePdfPackaging.
Font.registerHyphenationCallback((word) => [word])

// Mismos tokens de marca que src/index.css (@theme) -- react-pdf no puede leer variables CSS,
// así que se repiten acá como constantes. Si la paleta cambia allá, hay que replicarlo acá.
export const BRAND_900 = "#044e27"
export const BRAND_700 = "#0a6b38"
export const BRAND_500 = "#6eac19"
const MINT = "#eef5ec"
const MINT_STRONG = "#d6e8d0"
const INK_900 = "#1a2b22"
const INK_600 = "#5b6b63"
const LINE = "#e3e8e4"
const CANVAS = "#f6f8f5"
const SURFACE = "#ffffff"
const CORAL = "#e3a189"
// Rojo del aviso "cotización de referencia" (mismos tokens que index.css).
const DANGER_FG = "#b3261e"
const DANGER_BG = "#fcefeb"
const DANGER_BD = "#eac5be"

// Alias conservado para quotePdfPackaging.component.tsx (trazo de los íconos).
export const VERDE_PROFUNDO = BRAND_700

export const quotePdfStyles = StyleSheet.create({
    page: {
        paddingTop: 30,
        paddingBottom: 56,
        paddingHorizontal: 34,
        fontSize: 9,
        fontFamily: "Helvetica",
        color: INK_900,
        backgroundColor: SURFACE,
    },

    // Franja de marca en el borde superior de cada página.
    topBand: { position: "absolute", top: 0, left: 0, right: 0, height: 6, flexDirection: "row" },
    topBandDeep: { flex: 6, backgroundColor: BRAND_900 },
    topBandLeaf: { flex: 3, backgroundColor: BRAND_500 },
    topBandWarm: { flex: 1, backgroundColor: CORAL },

    // ===============================
    // Encabezado
    // ===============================
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 18,
    },
    logo: {
        width: 104,
        height: 58,
        objectFit: "contain",
    },
    headerTitleBlock: {
        alignItems: "flex-end",
    },
    headerTitle: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 1.6,
        color: BRAND_500,
    },
    headerSubtitle: {
        marginTop: 3,
        fontSize: 20,
        fontFamily: "Helvetica-Bold",
        color: BRAND_900,
    },

    // ===============================
    // Datos generales (cliente / fechas)
    // ===============================
    infoBox: {
        flexDirection: "row",
        backgroundColor: MINT,
        borderRadius: 8,
        marginBottom: 20,
    },
    infoCell: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRightWidth: 1,
        borderRightColor: SURFACE,
    },
    infoCellLast: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    infoLabel: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        color: BRAND_700,
        marginBottom: 3,
    },
    infoValue: {
        fontSize: 10.5,
        fontFamily: "Helvetica-Bold",
        color: INK_900,
    },

    sectionTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    sectionTitleBar: {
        width: 3,
        height: 12,
        borderRadius: 2,
        backgroundColor: BRAND_500,
        marginRight: 6,
    },
    sectionTitle: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: BRAND_900,
    },

    // ===============================
    // Línea cotizada (una por producto)
    // ===============================
    lineCard: {
        borderWidth: 1,
        borderColor: LINE,
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: SURFACE,
    },
    lineHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: LINE,
    },
    lineNumber: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: BRAND_900,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 9,
    },
    lineNumberText: {
        fontSize: 8.5,
        fontFamily: "Helvetica-Bold",
        color: SURFACE,
    },
    lineHeaderText: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        paddingRight: 10,
    },
    lineHeaderProduct: {
        fontSize: 11.5,
        fontFamily: "Helvetica-Bold",
        color: INK_900,
    },
    lineHeaderVariant: {
        marginTop: 2,
        fontSize: 8,
        color: INK_600,
    },
    lineHeaderDestination: {
        marginTop: 2,
        fontSize: 8,
        color: BRAND_700,
    },
    lineHeaderTotal: {
        alignItems: "flex-end",
    },
    lineTotalLabel: {
        fontSize: 6.5,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 0.6,
        color: INK_600,
    },
    lineTotalValue: {
        marginTop: 2,
        fontSize: 13,
        fontFamily: "Helvetica-Bold",
        color: BRAND_700,
    },

    lineStatsRow: {
        flexDirection: "row",
        gap: 6,
        paddingHorizontal: 12,
        paddingTop: 10,
    },
    lineStat: {
        flex: 1,
        backgroundColor: CANVAS,
        borderRadius: 6,
        paddingVertical: 7,
        paddingHorizontal: 9,
    },
    lineStatValue: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: BRAND_900,
    },
    lineStatLabel: {
        fontSize: 6.5,
        color: INK_600,
        marginTop: 2,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },

    // Composición + empaque (ambas variantes, solo nombres -- nunca costos)
    packagingConfigSection: {
        paddingHorizontal: 12,
        paddingTop: 10,
    },
    packagingConfigTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    packagingConfigTitleMark: {
        width: 3,
        height: 9,
        borderRadius: 2,
        backgroundColor: BRAND_500,
        marginRight: 5,
    },
    packagingConfigTitle: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        color: BRAND_700,
    },
    compositionChips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        marginBottom: 4,
    },
    compositionChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: MINT,
        borderRadius: 10,
        paddingVertical: 3,
        paddingHorizontal: 8,
    },
    compositionChipPercent: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: BRAND_700,
        marginRight: 4,
    },
    compositionChipName: {
        fontSize: 8,
        color: INK_900,
    },
    packagingCards: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
    },
    packagingCard: {
        flexGrow: 1,
        flexDirection: "row",
        alignItems: "center",
        padding: 6,
        minHeight: 38,
        borderWidth: 0.75,
        borderColor: LINE,
        borderRadius: 6,
        backgroundColor: SURFACE,
    },
    packagingIcon: {
        width: 26,
        height: 26,
        flexShrink: 0,
        marginRight: 7,
        padding: 3,
        borderRadius: 6,
        backgroundColor: MINT,
    },
    packagingCardText: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
    packagingMaterialType: {
        fontSize: 6,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        lineHeight: 1.3,
        color: INK_600,
        marginBottom: 2,
    },
    packagingMaterialName: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        lineHeight: 1.3,
        color: INK_900,
    },
    packagingConfigGroupValue: {
        fontSize: 8.5,
        fontFamily: "Helvetica-Bold",
        color: INK_900,
    },
    packagingConfigFixed: {
        fontSize: 7.5,
        color: INK_600,
        marginTop: 2,
    },

    // Desglose de costos (solo admin, showCostBreakdown)
    breakdownSection: {
        marginHorizontal: 12,
        marginTop: 10,
        borderTopWidth: 0.75,
        borderTopColor: LINE,
    },
    breakdownRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
        paddingHorizontal: 2,
        borderBottomWidth: 0.75,
        borderBottomColor: LINE,
    },
    breakdownLabel: {
        color: INK_600,
    },
    breakdownValue: {
        fontFamily: "Helvetica-Bold",
        color: INK_900,
    },

    lineCardFooter: {
        height: 12,
    },

    // ===============================
    // Total del pedido
    // ===============================
    orderTotalRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: BRAND_900,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 4,
        marginBottom: 14,
    },
    orderTotalLabel: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 1,
        color: MINT_STRONG,
    },
    orderTotalValue: {
        fontSize: 18,
        fontFamily: "Helvetica-Bold",
        color: SURFACE,
    },

    // ===============================
    // Aviso "cotización de referencia" (solo cliente)
    // ===============================
    disclaimerBox: {
        borderWidth: 0.75,
        borderColor: DANGER_BD,
        borderLeftWidth: 3,
        borderLeftColor: DANGER_FG,
        backgroundColor: DANGER_BG,
        borderRadius: 6,
        paddingVertical: 9,
        paddingHorizontal: 11,
        marginBottom: 10,
    },
    disclaimerText: {
        fontSize: 8.5,
        fontFamily: "Helvetica-Bold",
        lineHeight: 1.45,
        color: DANGER_FG,
    },

    // ===============================
    // Restricciones
    // ===============================
    restrictionsBox: {
        borderLeftWidth: 3,
        borderLeftColor: BRAND_500,
        backgroundColor: CANVAS,
        borderRadius: 6,
        paddingVertical: 9,
        paddingHorizontal: 11,
    },
    restrictionsTitle: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        color: BRAND_900,
        marginBottom: 3,
    },
    restrictionsText: {
        fontSize: 8.5,
        lineHeight: 1.45,
        color: INK_600,
    },

    // ===============================
    // Pie de página (fijo en cada página)
    // ===============================
    footer: {
        position: "absolute",
        left: 34,
        right: 34,
        bottom: 22,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 7,
        borderTopWidth: 0.75,
        borderTopColor: LINE,
    },
    footerBrand: {
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        color: BRAND_900,
    },
    generatedAt: {
        fontSize: 7,
        color: INK_600,
    },
    footerPage: {
        fontSize: 7,
        color: INK_600,
    },
})
