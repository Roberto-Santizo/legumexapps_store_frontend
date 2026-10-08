import { useRef } from "react"
import { Document, Page, View, Text, Image } from "@react-pdf/renderer"
import { useTranslation } from "react-i18next"
import type { QuoteDocumentLine, QuoteLine, QuoteLineComposition } from "@/feature/quote/schema/quote.schema"
import { quotePdfStyles as styles } from "@/feature/quote/component/quotePdfDocument.styles"
import {
    QUOTE_VALIDITY_DAYS,
    calculateQuoteOrderTotal,
    calculateQuoteValidUntil,
    quotePdfDateFormatter as pdfDateFormatter,
} from "@/feature/quote/component/quotePdfSummary"
import { QuotePdfPackaging } from "@/feature/quote/component/quotePdfPackaging.component"
import { formatCurrency } from "@/shared/format/currency"

const pdfDateTimeFormatter = new Intl.DateTimeFormat("es-GT", { dateStyle: "short", timeStyle: "short" })

const compositionNumberFormatter = new Intl.NumberFormat("es-GT", { maximumFractionDigits: 3 })

// Composición de una línea A LA MEDIDA (solo esas la traen, ver QuoteLineComposition): la receta que
// armó el representante -- % de cada materia prima y gramos por unidad de cada ingrediente agregado.
// Solo nombres y cantidades, NUNCA costos, así que va en ambas variantes (sin gate de
// showCostBreakdown), igual que la configuración de empaque.
function CompositionSection({ composition }: Readonly<{ composition: QuoteLineComposition }>) {
    const { t } = useTranslation()
    if (composition.rawMaterials.length === 0) return null

    return (
        <View style={styles.packagingConfigSection}>
            <View style={styles.packagingConfigTitleRow}>
                <View style={styles.packagingConfigTitleMark} />
                <Text style={styles.packagingConfigTitle}>{t("quote.pdf.document.composition.title")}</Text>
            </View>
            <Text style={styles.packagingConfigGroupValue}>
                {composition.rawMaterials
                    .map((rawMaterial) =>
                        t("quote.pdf.document.composition.rawMaterial", {
                            percentage: compositionNumberFormatter.format(rawMaterial.percentage),
                            name: rawMaterial.displayName,
                        })
                    )
                    .join(" · ")}
            </Text>
            {composition.context && <Text style={styles.packagingConfigFixed}>
                {composition.context.categoryName} · {composition.context.subCategoryName} · {t(composition.context.isOrganic ? "catalogQuote.organic" : "catalogQuote.conventional")} · {t(`catalogQuote.types.${composition.context.ingredientType}`)}
            </Text>}
            {composition.ingredients.length > 0 && (
                <Text style={styles.packagingConfigFixed}>
                    {t("quote.pdf.document.composition.ingredients", {
                        ingredients: composition.ingredients
                            .map((ingredient) =>
                                t("quote.pdf.document.composition.ingredient", {
                                    name: ingredient.displayName,
                                    grams: compositionNumberFormatter.format(ingredient.gramsPerUnit),
                                })
                            )
                            .join(", "),
                    })}
                </Text>
            )}
        </View>
    )
}

type QuotePdfDocumentProps = {
    clientName: string
    quoteDate: Date
    // Cualquier línea cotizada (producto definido o a la medida); las a la medida traen composición.
    lines: QuoteDocumentLine[]
    // El cliente final no ve el desglose interno de costos, solo el admin.
    showCostBreakdown?: boolean
    // Transporte apagado para todos por ahora; independiente de showCostBreakdown.
    showTransport?: boolean
    // Aviso "cotización de referencia" (solo representante): un bloque único por documento, cerca del
    // total del pedido.
    showReferenceDisclaimer?: boolean
}

// Documento PDF del resumen de cotización: se genera bajo demanda en el navegador y nunca se guarda
// en el servidor.
export function QuotePdfDocument({
    clientName,
    quoteDate,
    lines,
    showCostBreakdown = true,
    showTransport = false,
    showReferenceDisclaimer = false,
}: Readonly<QuotePdfDocumentProps>) {
    const { t } = useTranslation()

    // Mismo criterio que QuotedOrderSummary: las líneas no tienen id propio (una línea cotizada es
    // una vista previa de cálculo, no una entidad persistida), así que se identifican por
    // identidad de objeto en vez de por índice -- estable aunque el pedido crezca, y no colisiona
    // entre dos líneas con contenido idéntico (mismo producto cotizado dos veces).
    const lineIdsRef = useRef(new WeakMap<QuoteLine, string>())
    const getLineId = (line: QuoteLine) => {
        const existingId = lineIdsRef.current.get(line)
        if (existingId) return existingId
        const newId = crypto.randomUUID()
        lineIdsRef.current.set(line, newId)
        return newId
    }

    const orderTotal = calculateQuoteOrderTotal(lines)
    const validUntil = calculateQuoteValidUntil(quoteDate)

    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <View style={styles.headerRow}>
                    {/* Logo servido como asset local (public/logo-legumex.png), NO desde
                    VITE_IMAGE_LOGO (S3). A diferencia del <img> del login, que solo necesita
                    mostrar la imagen, @react-pdf/renderer necesita descargar los bytes con
                    fetch() para incrustarlos en el PDF -- eso lo generamos en el navegador del
                    cliente (ver quotePdfButton.component.tsx), así que depender de un fetch
                    cross-origin a S3 hace que el logo del PDF esté a merced de CORS, DNS y de
                    que la variable de entorno esté bien configurada en cada deploy. Sirviéndolo
                    desde el propio dominio del frontend, el fetch es same-origin y no depende
                    de ninguna infraestructura externa. */}
                    <Image src="/logo-legumex.png" style={styles.logo} />
                    <View style={styles.headerTitleBlock}>
                        <Text style={styles.headerTitle}>{t("quote.pdf.document.title")}</Text>
                        <Text style={styles.headerSubtitle}>{t("quote.pdf.document.subtitle")}</Text>
                    </View>
                </View>

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

                {lines.map((line) => (
                    <View key={getLineId(line)} style={styles.lineCard} wrap={false}>
                        <View style={styles.lineHeader}>
                            <Text style={styles.lineHeaderProduct}>
                                {line.productDisplayName}
                                {line.variantLabel && <Text style={styles.lineHeaderVariant}> · {line.variantLabel}</Text>}
                            </Text>
                            {/* Transporte apagado para todos por ahora (gateado por showTransport). */}
                            {showTransport && (
                                <Text style={styles.lineHeaderDestination}>{line.breakdown.transport.displayName}</Text>
                            )}
                        </View>

                        <View style={styles.lineStatsRow}>
                            <View style={styles.lineStat}>
                                <Text style={styles.lineStatValue}>{line.requestedPallets}</Text>
                                <Text style={styles.lineStatLabel}>{t("quote.pdf.document.pallets")}</Text>
                            </View>
                            {/* Mismo criterio que QuoteResultCard: el cliente final ve cajas por
                            palet, no el conteo crudo de bolsas (totalUnits es un dato interno). */}
                            {showCostBreakdown ? (
                                <View style={styles.lineStat}>
                                    <Text style={styles.lineStatValue}>{line.totalUnits.toLocaleString("es-MX")}</Text>
                                    <Text style={styles.lineStatLabel}>{t("quote.pdf.document.units")}</Text>
                                </View>
                            ) : (
                                <View style={styles.lineStat}>
                                    <Text style={styles.lineStatValue}>{line.boxesPerPallet ?? "-"}</Text>
                                    <Text style={styles.lineStatLabel}>{t("quote.pdf.document.boxesPerPallet")}</Text>
                                </View>
                            )}
                            <View style={styles.lineStatLast}>
                                <Text style={styles.lineStatValue}>
                                    {formatCurrency(line.totalCost / line.requestedPallets)}
                                </Text>
                                <Text style={styles.lineStatLabel}>{t("quote.pdf.document.perPallet")}</Text>
                            </View>
                        </View>

                        {line.composition && <CompositionSection composition={line.composition} />}

                        <QuotePdfPackaging breakdown={line.breakdown} />

                        {showCostBreakdown && (
                            <View style={styles.breakdownSection}>
                                {line.breakdown.rawMaterials.length > 0 && (
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>{t("quote.pdf.document.rawMaterials")}</Text>
                                        <Text style={styles.breakdownValue}>{formatCurrency(line.rawMaterialCost)}</Text>
                                    </View>
                                )}
                                {line.breakdown.ingredients && line.breakdown.ingredients.length > 0 && (
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>{t("quote.pdf.document.ingredients")}</Text>
                                        <Text style={styles.breakdownValue}>{formatCurrency(line.ingredientCost ?? 0)}</Text>
                                    </View>
                                )}
                                {line.breakdown.unitMaterials && line.breakdown.unitMaterials.length > 0 && (
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>{t("quote.pdf.document.unitPackaging")}</Text>
                                        <Text style={styles.breakdownValue}>{formatCurrency(line.unitPackagingCost)}</Text>
                                    </View>
                                )}
                                {line.breakdown.intermediateMaterials && line.breakdown.intermediateMaterials.length > 0 && (
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>{t("quote.pdf.document.intermediatePackaging")}</Text>
                                        <Text style={styles.breakdownValue}>{formatCurrency(line.intermediatePackagingCost)}</Text>
                                    </View>
                                )}
                                {line.breakdown.processingCosts && line.breakdown.processingCosts.length > 0 && (
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>{t("quote.pdf.document.processingCosts")}</Text>
                                        <Text style={styles.breakdownValue}>{formatCurrency(line.processingCostTotal ?? 0)}</Text>
                                    </View>
                                )}
                                {line.breakdown.palletMaterials.length > 0 && (
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>{t("quote.pdf.document.palletMaterials")}</Text>
                                        <Text style={styles.breakdownValue}>{formatCurrency(line.palletMaterialCost)}</Text>
                                    </View>
                                )}
                                {line.breakdown.percentageCosts && line.breakdown.percentageCosts.length > 0 && (
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>{t("quote.pdf.document.percentageCosts")}</Text>
                                        <Text style={styles.breakdownValue}>{formatCurrency(line.percentageCostTotal ?? 0)}</Text>
                                    </View>
                                )}
                                {showTransport && (
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>{t("quote.pdf.document.transport")}</Text>
                                        <Text style={styles.breakdownValue}>{formatCurrency(line.transportCost)}</Text>
                                    </View>
                                )}
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

                <View style={styles.orderTotalRow}>
                    <Text style={styles.orderTotalLabel}>{t("quote.pdf.document.orderTotal")}</Text>
                    <Text style={styles.orderTotalValue}>{formatCurrency(orderTotal)}</Text>
                </View>

                {showReferenceDisclaimer && (
                    <View style={styles.disclaimerBox}>
                        <Text style={styles.disclaimerText}>{t("quote.pdf.document.referenceDisclaimer")}</Text>
                    </View>
                )}

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
