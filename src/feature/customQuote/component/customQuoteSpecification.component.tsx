import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Boxes, FlaskConical, Layers, PackageOpen, PackagePlus, Wheat } from "lucide-react"
import type { AdminCustomQuoteDetail } from "@/feature/customQuote/schema/adminCustomQuote.schema"
import { Card } from "@/shared/component/card.component"
import { Chip } from "@/shared/component/chip.component"
import { Table, TableBody, TableContainer, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"

// Ficha de fabricación de una cotización a la medida: lo que el representante armó, tal como quedó
// congelado al guardar (receta, ingredientes, presentación + palet, empaques con sus cantidades). Todo
// sale del snapshot (breakdown + configuration), así que un cambio posterior en las listas de permitidos
// no la altera. Sin costos -- el desglose de costos va aparte (QuoteResultCard).

const numberFormatter = new Intl.NumberFormat("es-GT", { maximumFractionDigits: 3 })

function SpecSection({ icon, title, children }: Readonly<{ icon: ReactNode; title: string; children: ReactNode }>) {
    return (
        <section className="border-t border-gris-campo pt-5 first:border-t-0 first:pt-0">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-texto-suave uppercase">
                {icon}
                {title}
            </h2>
            {children}
        </section>
    )
}

function SpecValue({ label, value }: Readonly<{ label: string; value: ReactNode }>) {
    return (
        <div className="rounded-[10px] bg-crema p-3">
            <p className="text-xs text-texto-suave">{label}</p>
            <p className="font-semibold text-verde-profundo">{value}</p>
        </div>
    )
}

type PackagingRow = { key: string; name: string; group: string | null; quantity: string }

function PackagingLevelTable({ title, icon, rows }: Readonly<{ title: string; icon: ReactNode; rows: PackagingRow[] }>) {
    const { t } = useTranslation()
    if (rows.length === 0) return null

    return (
        <div className="mb-4 last:mb-0">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-verde-profundo">
                {icon}
                {title}
            </p>
            <TableContainer>
                <Table>
                    <TableHead>
                        <tr>
                            <Th>{t("adminCustomQuote.spec.packagingMaterial")}</Th>
                            <Th>{t("materialOptionGroup.table.group")}</Th>
                            <Th>{t("adminCustomQuote.spec.packagingQuantity")}</Th>
                        </tr>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.key}>
                                <Td className="whitespace-normal">{row.name}</Td>
                                <Td>{row.group ?? t("materialOptionGroup.table.fixed")}</Td>
                                <Td className="whitespace-normal">{row.quantity}</Td>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    )
}

export function CustomQuoteSpecification({ customQuote }: Readonly<{ customQuote: AdminCustomQuoteDetail }>) {
    const { t } = useTranslation()
    const { breakdown, configuration } = customQuote

    // % de la configuración guardada, nombre (traducido al guardar) del desglose, emparejados por id.
    const rawMaterialNames = new Map(breakdown.rawMaterials.map((line) => [line.rawMaterialId, line.displayName]))
    const composition = configuration.rawMaterialMix.map((line) => ({
        rawMaterialId: line.rawMaterialId,
        name: rawMaterialNames.get(line.rawMaterialId) ?? `#${line.rawMaterialId}`,
        percentage: line.percentage,
    }))
    const ingredients = breakdown.ingredients ?? []

    const boxesPerPallet = customQuote.boxesPerPallet ?? configuration.pallet.boxesPerPallet
    const palletBasisByPackagingId = new Map(configuration.packaging.pallet.map((entry) => [entry.packagingId, entry]))

    const unitRows: PackagingRow[] = (breakdown.unitMaterials ?? []).map((line) => ({
        key: `unit:${line.packagingId}`,
        name: line.displayName,
        group: line.optionGroup,
        quantity: t("adminCustomQuote.spec.perUnit", { quantity: numberFormatter.format(line.quantityPerUnit) }),
    }))
    const intermediateRows: PackagingRow[] = (breakdown.intermediateMaterials ?? []).map((line) => ({
        key: `intermediate:${line.packagingId}`,
        name: line.displayName,
        group: line.optionGroup,
        quantity: t("adminCustomQuote.spec.perIntermediate", {
            units: line.unitsPerPackage,
            packages: numberFormatter.format(line.packagesNeeded),
        }),
    }))
    const palletRows: PackagingRow[] = breakdown.palletMaterials.map((line) => {
        const configured = palletBasisByPackagingId.get(line.packagingId)
        const quantity =
            configured?.quantityBasis === "per_box" && configured.quantity !== null
                ? t("adminCustomQuote.spec.perBox", {
                      quantity: numberFormatter.format(configured.quantity),
                      boxes: boxesPerPallet,
                      perPallet: numberFormatter.format(line.quantityPerPallet),
                  })
                : t("adminCustomQuote.spec.perPallet", { quantity: numberFormatter.format(line.quantityPerPallet) })
        return { key: `pallet:${line.packagingId}`, name: line.displayName, group: line.optionGroup, quantity }
    })

    return (
        <Card className="space-y-5">
            <SpecSection icon={<Wheat size={15} />} title={t("adminCustomQuote.spec.recipe")}>
                <ul className="space-y-1.5">
                    {composition.map((line) => (
                        <li key={line.rawMaterialId} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-verde-profundo">{line.name}</span>
                            <span className="font-semibold text-verde-profundo">{numberFormatter.format(line.percentage)} %</span>
                        </li>
                    ))}
                </ul>
                {customQuote.isOrganic && (
                    <div className="mt-3">
                        <Chip tone="fresh">{t("site.quoteRequest.form.organicBadge")}</Chip>
                    </div>
                )}
            </SpecSection>

            <SpecSection icon={<FlaskConical size={15} />} title={t("adminCustomQuote.spec.ingredients")}>
                {ingredients.length === 0 ? (
                    <p className="text-sm text-texto-suave">{t("adminCustomQuote.spec.noIngredients")}</p>
                ) : (
                    <ul className="space-y-1.5">
                        {ingredients.map((line) => (
                            <li key={line.ingredientId} className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-verde-profundo">{line.displayName}</span>
                                <span className="font-semibold text-verde-profundo">
                                    {t("adminCustomQuote.spec.gramsPerUnit", { grams: numberFormatter.format(line.gramsPerUnit) })}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </SpecSection>

            <SpecSection icon={<Boxes size={15} />} title={t("adminCustomQuote.spec.presentation")}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <SpecValue label={t("adminCustomQuote.spec.presentationLabel")} value={customQuote.presentationLabel ?? "—"} />
                    <SpecValue label={t("site.quoteRequest.form.wizard.pallets.boxesPerPallet")} value={boxesPerPallet} />
                    <SpecValue label={t("adminCustomQuote.spec.bagsPerBox")} value={customQuote.bagsPerBox} />
                    <SpecValue
                        label={t("adminCustomQuote.spec.unitsPerIntermediatePackage")}
                        value={customQuote.unitsPerIntermediatePackage ?? t("adminCustomQuote.spec.noIntermediate")}
                    />
                    <SpecValue label={t("site.quoteRequest.form.requestedPallets")} value={customQuote.requestedPallets} />
                    <SpecValue label={t("adminCustomQuote.spec.totalUnits")} value={customQuote.totalUnits.toLocaleString("es-GT")} />
                </div>
            </SpecSection>

            <SpecSection icon={<Layers size={15} />} title={t("adminCustomQuote.spec.packaging")}>
                <PackagingLevelTable title={t("site.quoteRequest.form.unitMaterialLabel")} icon={<PackageOpen size={15} />} rows={unitRows} />
                <PackagingLevelTable
                    title={t("site.quoteRequest.form.intermediateMaterialLabel")}
                    icon={<PackagePlus size={15} />}
                    rows={intermediateRows}
                />
                <PackagingLevelTable title={t("site.quoteRequest.form.palletMaterialLabel")} icon={<Layers size={15} />} rows={palletRows} />
            </SpecSection>
        </Card>
    )
}
