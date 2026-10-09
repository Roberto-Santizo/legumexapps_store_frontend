import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import { useTranslation } from "react-i18next"
import type { QuoteLine } from "../schema/quote.schema"
import { productionMaterials, consolidateProductionMaterials } from "./quoteProductionData"
import type { ProductionMaterial } from "./quoteProductionData"

const styles = StyleSheet.create({
    page: { padding: 32, paddingBottom: 44, fontSize: 9, fontFamily: "Helvetica", color: "#0f2e1e" },
    title: { fontSize: 19, fontFamily: "Helvetica-Bold", marginBottom: 12 },
    heading: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 8 },
    detail: { marginBottom: 5 },
    row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#dce4de", paddingVertical: 6 },
    code: { width: "20%", paddingRight: 6 }, name: { width: "42%", paddingRight: 6 }, recipe: { width: "18%", paddingRight: 6 }, quantity: { width: "20%", textAlign: "right" },
    header: { backgroundColor: "#eff4ef", fontFamily: "Helvetica-Bold" },
    footer: { position: "absolute", bottom: 20, left: 32, right: 32, textAlign: "right", fontSize: 8 },
})

export type ProductionReportProps = { lines: QuoteLine[]; clientName: string; orderId: string; salespersonName?: string; quoteDate: Date }

function MaterialTable({ title, rows }: Readonly<{ title: string; rows: ProductionMaterial[] }>) {
    const { t, i18n } = useTranslation()
    const number = (value: number) => value.toLocaleString(i18n.language, { maximumFractionDigits: 6 })
    if (!rows.length) return null
    return <View>
        <Text style={styles.heading} minPresenceAhead={65}>{title}</Text>
        <View style={[styles.row, styles.header]} wrap={false}>
            <Text style={styles.code}>{t("quote.production.code")}</Text><Text style={styles.name}>{t("quote.production.material")}</Text><Text style={styles.recipe}>{t("quote.production.recipe")}</Text><Text style={styles.quantity}>{t("quote.production.required")}</Text>
        </View>
        {rows.map((row, index) => <View key={`${row.code}:${index}`} style={styles.row} wrap={false}>
            <Text style={styles.code}>{row.code || t("quote.production.unavailable")}</Text>
            <Text style={styles.name}>{row.group ? `${row.group}: ` : ""}{row.name}</Text>
            <Text style={styles.recipe}>{row.percentage == null ? "" : `${number(row.percentage)}%`}{row.perUnitGrams == null ? "" : `\n${number(row.perUnitGrams)} g/${t("quote.production.unit")}`}</Text>
            <Text style={styles.quantity}>{row.quantity == null ? t("quote.production.unavailable") : `${number(row.quantity)} ${row.unit === "units" ? t("quote.production.units") : row.unit}`}</Text>
        </View>)}
    </View>
}

export function QuoteProductionDocument({ lines, clientName, orderId, salespersonName, quoteDate }: Readonly<ProductionReportProps>) {
    const { t, i18n } = useTranslation()
    return <Document title={t("quote.production.title")}>
        <Page size="LETTER" style={styles.page}>
            <Text style={styles.title}>{t("quote.production.title")}</Text>
            <Text style={styles.detail}>{t("quote.production.order")}: {orderId}</Text>
            <Text style={styles.detail}>{t("quote.production.clientName")}: {clientName || t("quote.production.unavailable")}</Text>
            <Text style={styles.detail}>{t("quote.production.salesperson")}: {salespersonName || t("quote.production.unavailable")}</Text>
            <Text style={styles.detail}>{t("quote.production.date")}: {quoteDate.toLocaleDateString(i18n.language, { timeZone: "America/Guatemala" })}</Text>
            <Text style={styles.detail}>{t("quote.production.purpose")}</Text>
            {lines.map((line, index) => {
                const production = line.breakdown.production
                const materials = productionMaterials(line)
                return <View key={index} break={index > 0}>
                    {index > 0 && <Text style={styles.detail}>{t("quote.production.order")}: {orderId} · {clientName}</Text>}
                    <Text style={styles.heading} minPresenceAhead={100}>{index + 1}. {line.productDisplayName}</Text>
                    <Text style={styles.detail}>{line.variantLabel ?? ""}</Text>
                    <Text style={styles.detail}>{t("quote.production.productCode")}: {production?.skuCode || t(production?.kind === "customizable" ? "quote.production.customNoSku" : "quote.production.unavailable")}</Text>
                    {production?.productId != null && <Text style={styles.detail}>{t("quote.production.productId")}: {production.productId}</Text>}
                    <Text style={styles.detail}>{t("quote.production.pallets")}: {line.requestedPallets} · {t("quote.production.totalUnits")}: {line.totalUnits}</Text>
                    {production && <Text style={styles.detail}>{t("quote.production.boxesPerPallet")}: {production.boxesPerPallet} · {t("quote.production.unitsPerBox")}: {production.bagsPerBox} · {t("quote.production.totalBoxes")}: {production.boxesPerPallet * line.requestedPallets}</Text>}
                    {production?.netWeightGrams != null && <Text style={styles.detail}>{t("quote.production.netWeight")}: {production.netWeightGrams} g · {t("quote.production.totalWeight")}: {(production.netWeightGrams * line.totalUnits / 1000).toLocaleString(i18n.language, { maximumFractionDigits: 6 })} kg</Text>}
                    {(Object.keys(materials) as (keyof typeof materials)[]).map(level => <MaterialTable key={level} title={t(`quote.production.levels.${level}`)} rows={materials[level]} />)}
                </View>
            })}
            <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </Page>
        <Page size="LETTER" style={styles.page}>
            <Text style={styles.title}>{t("quote.production.consolidated")}</Text>
            <Text style={styles.detail}>{t("quote.production.order")}: {orderId}</Text>
            <MaterialTable title={t("quote.production.materialsTotal")} rows={consolidateProductionMaterials(lines)} />
            <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </Page>
    </Document>
}
