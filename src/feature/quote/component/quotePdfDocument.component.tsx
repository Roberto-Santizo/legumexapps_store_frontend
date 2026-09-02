import { Document, Page, View, Text, Image } from "@react-pdf/renderer"
import { useTranslation } from "react-i18next"
import type { QuoteCalculation } from "@/feature/quote/schema/quote.schema"
import { quotePdfStyles as styles } from "@/feature/quote/component/quotePdfDocument.styles"
import {
    QUOTE_VALIDITY_DAYS,
    calculateQuoteOrderTotal,
    calculateQuoteValidUntil,
    quotePdfDateFormatter as pdfDateFormatter,
} from "@/feature/quote/component/quotePdfSummary"
import { formatCurrency } from "@/shared/format/currency"

const pdfDateTimeFormatter = new Intl.DateTimeFormat("es-GT", { dateStyle: "short", timeStyle: "short" })

type QuotePdfDocumentProps = {
    clientName: string
    quoteDate: Date
    lines: QuoteCalculation[]
    // Mismo criterio que QuoteResultCard/QuotedOrderSummary: el cliente final no ve el desglose
    // interno de costos, solo el admin (ver adminQuoteCalculator.page.tsx vs quoteRequest.page.tsx).
    showCostBreakdown?: boolean
}

// Documento PDF del "resumen de cotización" -- se genera bajo demanda desde el cotizador (público
// o admin) cuando ya hay al menos una línea cotizada en la sesión (ver quotePdfButton.component.tsx),
// nunca se persiste ni se guarda en el servidor. Usa @react-pdf/renderer, mismo enfoque que el
// resto del repo para documentos descargables (packing list), pero con su propio diseño ajustado
// a los datos del cotizador (no hay tarimas/lotes acá, hay productos/palets/costos).
export function QuotePdfDocument({ clientName, quoteDate, lines, showCostBreakdown = true }: Readonly<QuotePdfDocumentProps>) {
    const { t } = useTranslation()

    const orderTotal = calculateQuoteOrderTotal(lines)
    const validUntil = calculateQuoteValidUntil(quoteDate)

    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                {/* Encabezado */}
                <View style={styles.headerRow}>
                    <Image src={import.meta.env.VITE_IMAGE_LOGO} style={styles.logo} />
                    <View style={styles.headerTitleBlock}>
                        <Text style={styles.headerTitle}>{t("quote.pdf.document.title")}</Text>
                        <Text style={styles.headerSubtitle}>{t("quote.pdf.document.subtitle")}</Text>
                    </View>
                </View>

                {/* Datos generales */}
                <View style={styles.infoBox}>
                    <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>{t("quote.pdf.document.client")}</Text>
                        <Text style={styles.infoValue}>{clientName}</Text>
                    </View>
                    <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>{t("quote.pdf.document.quoteDate")}</Text>
                        <Text style={styles.infoValue}>{pdfDateFormatter.format(quoteDate)}</Text>
                    </View>
                    <View style={styles.infoCellLast}>
                        <Text style={styles.infoLabel}>{t("quote.pdf.document.validUntil")}</Text>
                        <Text style={styles.infoValue}>{pdfDateFormatter.format(validUntil)}</Text>
                    </View>
                </View>

                {/* Líneas cotizadas */}
                {lines.map((line, index) => (
                    <View key={index} style={styles.lineCard} wrap={false}>
                        <View style={styles.lineHeader}>
                            <Text style={styles.lineHeaderProduct}>
                                {line.productDisplayName}
                                {line.variantLabel && <Text style={styles.lineHeaderVariant}> · {line.variantLabel}</Text>}
                            </Text>
                            <Text style={styles.lineHeaderDestination}>{line.breakdown.transport.displayName}</Text>
                        </View>

                        <View style={styles.lineStatsRow}>
                            <View style={styles.lineStat}>
                                <Text style={styles.lineStatValue}>{line.requestedPallets}</Text>
                                <Text style={styles.lineStatLabel}>{t("quote.pdf.document.pallets")}</Text>
                            </View>
                            <View style={styles.lineStat}>
                                <Text style={styles.lineStatValue}>{line.totalUnits.toLocaleString("es-MX")}</Text>
                                <Text style={styles.lineStatLabel}>{t("quote.pdf.document.units")}</Text>
                            </View>
                            <View style={styles.lineStatLast}>
                                <Text style={styles.lineStatValue}>
                                    {formatCurrency(line.totalCost / line.requestedPallets)}
                                </Text>
                                <Text style={styles.lineStatLabel}>{t("quote.pdf.document.perPallet")}</Text>
                            </View>
                        </View>

                        {showCostBreakdown && (
                            <View style={styles.breakdownSection}>
                                {line.breakdown.rawMaterials.length > 0 && (
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>{t("quote.pdf.document.rawMaterials")}</Text>
                                        <Text style={styles.breakdownValue}>{formatCurrency(line.rawMaterialCost)}</Text>
                                    </View>
                                )}
                                {line.breakdown.unitPackaging && (
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>{t("quote.pdf.document.unitPackaging")}</Text>
                                        <Text style={styles.breakdownValue}>{formatCurrency(line.unitPackagingCost)}</Text>
                                    </View>
                                )}
                                {line.breakdown.intermediatePackaging && (
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>{t("quote.pdf.document.intermediatePackaging")}</Text>
                                        <Text style={styles.breakdownValue}>{formatCurrency(line.intermediatePackagingCost)}</Text>
                                    </View>
                                )}
                                {line.breakdown.palletMaterials.length > 0 && (
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>{t("quote.pdf.document.palletMaterials")}</Text>
                                        <Text style={styles.breakdownValue}>{formatCurrency(line.palletMaterialCost)}</Text>
                                    </View>
                                )}
                                <View style={styles.breakdownRow}>
                                    <Text style={styles.breakdownLabel}>{t("quote.pdf.document.transport")}</Text>
                                    <Text style={styles.breakdownValue}>{formatCurrency(line.transportCost)}</Text>
                                </View>
                                {line.breakdown.adjustment && (
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>{t("quote.pdf.document.adjustment")}</Text>
                                        <Text style={styles.breakdownValue}>{formatCurrency(line.breakdown.adjustment.lineTotal)}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.lineTotalRow}>
                            <Text style={styles.lineTotalLabel}>{t("quote.pdf.document.lineTotal")}</Text>
                            <Text style={styles.lineTotalValue}>{formatCurrency(line.totalCost)}</Text>
                        </View>
                    </View>
                ))}

                {/* Total del pedido */}
                <View style={styles.orderTotalRow}>
                    <Text style={styles.orderTotalLabel}>{t("quote.pdf.document.orderTotal")}</Text>
                    <Text style={styles.orderTotalValue}>{formatCurrency(orderTotal)}</Text>
                </View>

                {/* Restricciones */}
                <View style={styles.restrictionsBox}>
                    <Text style={styles.restrictionsTitle}>{t("quote.pdf.document.restrictionsTitle")}</Text>
                    <Text style={styles.restrictionsText}>
                        {t("quote.pdf.document.restrictionsText", { days: QUOTE_VALIDITY_DAYS })}
                    </Text>
                </View>

                <Text style={styles.generatedAt}>
                    {t("quote.pdf.document.generatedAt", { date: pdfDateTimeFormatter.format(quoteDate) })}
                </Text>
            </Page>
        </Document>
    )
}
