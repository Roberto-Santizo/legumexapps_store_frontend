import { StyleSheet } from "@react-pdf/renderer"

// Mismos tokens de marca que src/index.css (@theme) -- react-pdf no puede leer variables CSS,
// así que se repiten acá como constantes. Si la paleta cambia allá, hay que replicarlo acá.
const VERDE_PROFUNDO = "#0f2e1e"
const DORADO = "#e9b93c"
const CREMA = "#f7f5ee"
const HUESO = "#fffdf8"
const GRIS_CAMPO = "#e3e0d5"
const TEXTO_SUAVE = "#5a6154"
const AVISO_FG = "#9a6b12"
const AVISO_BG = "#fbeecb"
const AVISO_BD = "#ead5a0"

export const quotePdfStyles = StyleSheet.create({
    page: {
        padding: 32,
        fontSize: 9,
        fontFamily: "Helvetica",
        color: VERDE_PROFUNDO,
        backgroundColor: HUESO,
    },

    // ===============================
    // Encabezado
    // ===============================
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 2,
        borderBottomColor: VERDE_PROFUNDO,
        paddingBottom: 12,
        marginBottom: 16,
    },
    logo: {
        width: 90,
        height: 56,
        objectFit: "contain",
    },
    headerTitleBlock: {
        alignItems: "flex-end",
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: "Helvetica-Bold",
        color: VERDE_PROFUNDO,
    },
    headerSubtitle: {
        marginTop: 2,
        fontSize: 9,
        color: TEXTO_SUAVE,
    },

    // ===============================
    // Datos generales (cliente / fechas)
    // ===============================
    infoBox: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: GRIS_CAMPO,
        borderRadius: 6,
        marginBottom: 16,
    },
    infoCell: {
        flex: 1,
        padding: 8,
        borderRightWidth: 1,
        borderRightColor: GRIS_CAMPO,
    },
    infoCellLast: {
        flex: 1,
        padding: 8,
    },
    infoLabel: {
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: TEXTO_SUAVE,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: VERDE_PROFUNDO,
    },

    // ===============================
    // Línea cotizada (una por producto)
    // ===============================
    lineCard: {
        borderWidth: 1,
        borderColor: GRIS_CAMPO,
        borderRadius: 6,
        marginBottom: 10,
    },
    lineHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: VERDE_PROFUNDO,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    lineHeaderProduct: {
        fontSize: 10.5,
        fontFamily: "Helvetica-Bold",
        color: HUESO,
    },
    lineHeaderVariant: {
        fontSize: 8.5,
        color: CREMA,
    },
    lineHeaderDestination: {
        fontSize: 8.5,
        color: DORADO,
        textAlign: "right",
    },
    lineStatsRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: GRIS_CAMPO,
    },
    lineStat: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 7,
        borderRightWidth: 1,
        borderRightColor: GRIS_CAMPO,
    },
    lineStatLast: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 7,
    },
    lineStatValue: {
        fontSize: 10.5,
        fontFamily: "Helvetica-Bold",
        color: VERDE_PROFUNDO,
    },
    lineStatLabel: {
        fontSize: 7,
        color: TEXTO_SUAVE,
        marginTop: 1,
        textTransform: "uppercase",
    },

    // Desglose de costos (solo admin, showCostBreakdown)
    breakdownSection: {
        paddingHorizontal: 10,
        paddingTop: 6,
    },
    breakdownRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 2.5,
        borderBottomWidth: 0.5,
        borderBottomColor: GRIS_CAMPO,
    },
    breakdownLabel: {
        color: TEXTO_SUAVE,
    },
    breakdownValue: {
        fontFamily: "Helvetica-Bold",
        color: VERDE_PROFUNDO,
    },

    lineTotalRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: CREMA,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderBottomLeftRadius: 6,
        borderBottomRightRadius: 6,
    },
    lineTotalLabel: {
        fontSize: 8.5,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        color: TEXTO_SUAVE,
    },
    lineTotalValue: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: VERDE_PROFUNDO,
    },

    // ===============================
    // Total del pedido
    // ===============================
    orderTotalRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: VERDE_PROFUNDO,
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginTop: 4,
        marginBottom: 20,
    },
    orderTotalLabel: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: DORADO,
    },
    orderTotalValue: {
        fontSize: 16,
        fontFamily: "Helvetica-Bold",
        color: HUESO,
    },

    // ===============================
    // Restricciones (pie de página)
    // ===============================
    restrictionsBox: {
        borderWidth: 1,
        borderColor: AVISO_BD,
        backgroundColor: AVISO_BG,
        borderRadius: 6,
        padding: 10,
        marginTop: 10,
    },
    restrictionsTitle: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: AVISO_FG,
        marginBottom: 3,
    },
    restrictionsText: {
        fontSize: 8.5,
        lineHeight: 1.4,
        color: AVISO_FG,
    },

    generatedAt: {
        marginTop: 10,
        fontSize: 7.5,
        color: TEXTO_SUAVE,
        textAlign: "center",
    },
})
