import { packagingName } from "@/shared/i18n/packagingName"
import { useState } from "react"
import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Boxes, Package, Layers3, Leaf, FlaskConical, Building2, ChevronRight, Scale, Barcode, AlertCircle } from "lucide-react"
import { getFixedProductDetailsAPI } from "../api/product.api"
import type { ProductDetails, ProductDetailsVariant, ProductDetailsPackaging } from "../schema/productDetails.schema"
import { Modal } from "@/shared/component/modal.component"
import { Button } from "@/shared/component/button.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"

function Section({ title, icon, children }: Readonly<{ title: string; icon: ReactNode; children: ReactNode }>) {
    return <section className="min-w-0 rounded-panel border border-line bg-surface p-4 sm:p-5">
        <h3 className="mb-4 flex items-center gap-3 font-semibold text-ink-900"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-customize-mint text-brand-700">{icon}</span>{title}</h3>
        {children}
    </section>
}

function Metric({ label, value }: Readonly<{ label: string; value: ReactNode }>) {
    return <div className="min-w-0 rounded-xl border border-line bg-canvas p-3"><dt className="text-xs font-medium text-ink-600">{label}</dt><dd className="mt-1 break-words text-base font-semibold text-ink-900">{value}</dd></div>
}

function MaterialIdentity({ name, code }: Readonly<{ name?: string; code?: string | null }>) {
    const { t } = useTranslation()
    return <div className="min-w-0"><p className="break-words font-medium text-ink-900">{name ?? t("productDetails.missingMaterial")}</p>
        <p className="mt-1 break-all font-mono text-xs text-ink-600"><span className="font-sans">{t("productDetails.code")}: </span>{code || t("productDetails.unavailable")}</p></div>
}

function Activity({ associationActive, materialActive }: Readonly<{ associationActive: boolean; materialActive?: boolean }>) {
    const { t } = useTranslation()
    if (associationActive && materialActive !== false) return null
    return <p className="mt-2 text-xs text-danger">{!associationActive ? t("productDetails.inactiveAssociation") : t("productDetails.inactiveMaterial")}</p>
}

function MaterialCost({ cost, unit, label }: Readonly<{ cost: number | null | undefined; unit?: string; label?: string }>) {
    const { t, i18n } = useTranslation()
    if (cost == null) return null
    const formatted = new Intl.NumberFormat(i18n.language, { style: "currency", currency: "USD", maximumFractionDigits: 4 }).format(cost)
    return <p className="mt-2 break-words text-xs text-ink-600">{label ?? t("productDetails.unitCost")}: {formatted}{unit ? ` / ${unit}` : ""}</p>
}

function Recipe({ product }: Readonly<{ product: ProductDetails }>) {
    const { t, i18n } = useTranslation()
    const format = (value: number) => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 }).format(value)
    return <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Section title={t("productDetails.rawMaterials")} icon={<Leaf size={19} aria-hidden="true" />}>
            {!product.productRawMaterials.length && <p className="text-sm text-ink-600">{t("productDetails.noRecipe")}</p>}
            <ul className="space-y-4">{product.productRawMaterials.map(row => {
                const material = row.usedRawMaterial
                const percentage = row.percentage
                const progress = Math.max(0, Math.min(100, percentage ?? 0))
                return <li key={row.id} className="min-w-0 rounded-xl border border-line p-3">
                    <div className="flex items-start justify-between gap-3"><MaterialIdentity name={material?.displayName} code={material?.code} />
                        <span className="shrink-0 rounded-lg bg-customize-mint px-2 py-1 text-sm font-semibold text-brand-700">{percentage == null ? t("productDetails.unavailable") : `${format(percentage)} %`}</span></div>
                    {percentage != null && <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas" role="progressbar" aria-label={material?.displayName ?? t("productDetails.rawMaterials")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={`${format(percentage)} %`}>
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${progress}%` }} />
                    </div>}
                    {material?.costUnit && <p className="mt-2 text-xs text-ink-600">{t("productDetails.costUnit")}: {material.costUnit.displayName} ({material.costUnit.unitCode})</p>}
                    {material && <p className="mt-2 text-xs text-ink-600">{t(`productDetails.materialTypes.${["fruit", "vegetable", "pulp", "other"].includes(material.ingredientType) ? material.ingredientType : "other"}`)}</p>}
                    <MaterialCost cost={material?.costPerUnit} unit={material?.costUnit?.displayName} />
                    <Activity associationActive={row.isActive} materialActive={material?.isActive} />
                </li>
            })}</ul>
        </Section>
        <Section title={t("productDetails.ingredients")} icon={<FlaskConical size={19} aria-hidden="true" />}>
            <p className="mb-4 text-sm leading-relaxed text-ink-600">{t("productDetails.ingredientsHint")}</p>
            {!product.productIngredients.length && <p className="text-sm text-ink-600">{t("productDetails.noIngredients")}</p>}
            <ul className="space-y-3">{product.productIngredients.map(row => <li key={row.id} className="min-w-0 rounded-xl border border-line p-3">
                <MaterialIdentity name={row.usedIngredient?.displayName} code={row.usedIngredient?.code} />
                <p className="mt-3 break-words text-sm font-medium text-ink-900">{t("productDetails.ingredientQuantity", { grams: format(row.grams), reference: format(row.referenceNetWeightGrams) })}</p>
                {row.usedIngredient?.costUnit && <p className="mt-2 text-xs text-ink-600">{t("productDetails.costUnit")}: {row.usedIngredient.costUnit.displayName} ({row.usedIngredient.costUnit.unitCode})</p>}
                <MaterialCost cost={row.usedIngredient?.costPerUnit} unit={row.usedIngredient?.costUnit?.displayName} />
                <Activity associationActive={row.isActive} materialActive={row.usedIngredient?.isActive} />
            </li>)}</ul>
        </Section>
    </div>
}

function PackagingRow({ material, quantity, group, isDefault, isActive }: Readonly<{
    material: ProductDetailsPackaging | null; quantity: string; group?: string | null; isDefault: boolean; isActive: boolean;
}>) {
    const { t, i18n } = useTranslation()
    const hasGroup = Boolean(group?.trim())
    return <li className="min-w-0 rounded-xl border border-line bg-canvas/50 p-3">
        <MaterialIdentity name={packagingName(material, i18n.language)} code={material?.code} />
        <p className="mt-3 break-words text-sm font-medium text-ink-900">{quantity}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-600">
            <span className="max-w-full break-words rounded-md border border-line bg-surface px-2 py-1">{hasGroup ? t(isDefault ? "productDetails.defaultOption" : "productDetails.alternative") : t("productDetails.fixedMaterial")}</span>
            {hasGroup && <span className="max-w-full break-words rounded-md border border-line px-2 py-1">{group}</span>}
        </div>
        <MaterialCost cost={material?.unitCost} />
        <Activity associationActive={isActive} materialActive={material?.isActive} />
    </li>
}

function VariantDetails({ variant }: Readonly<{ variant: ProductDetailsVariant }>) {
    const { t, i18n } = useTranslation()
    const format = (value: number | null | undefined) => value == null ? t("productDetails.unavailable") : new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 }).format(value)
    const hasPackaging = variant.unitMaterials.length + variant.intermediateMaterials.length + variant.palletMaterials.length > 0
    return <div className="min-w-0 space-y-4">
        <div className="rounded-panel border border-line bg-linear-to-br from-customize-mint via-surface to-accent-coral-bg p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-ink-600">{t("productDetails.selectedPresentation")}</p><h4 className="mt-1 break-words text-xl font-semibold text-ink-900">{variant.sizePresentation?.displayLabel ?? t("productDetails.unavailable")}</h4></div><StatusBadge isActive={variant.isActive} /></div>
            <dl className="mt-4 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
                <Metric label={t("productDetails.sku")} value={<span className="break-all font-mono text-sm">{variant.skuCode}</span>} />
                <Metric label={t("productDetails.netWeight")} value={variant.sizePresentation?.netWeightGrams == null ? t("productDetails.unavailable") : t("productDetails.grams", { value: format(variant.sizePresentation.netWeightGrams) })} />
                <Metric label={t("productDetails.unitsPerBox")} value={format(variant.bagsPerBox)} />
                <Metric label={t("productDetails.boxesPerPallet")} value={format(variant.boxesPerPallet)} />
                {variant.intermediateMaterials.length > 0 && <Metric label={t("productDetails.unitsPerIntermediate")} value={format(variant.unitsPerIntermediatePackage)} />}
            </dl>
            {variant.sizePresentation?.isActive === false && <p className="mt-3 text-sm text-danger">{t("productDetails.inactivePresentation")}</p>}
        </div>
        {hasPackaging ? <><p className="text-sm leading-relaxed text-ink-600">{t("productDetails.packagingHint")}</p><div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {variant.unitMaterials.length > 0 && <Section title={t("productDetails.unitPackaging")} icon={<Package size={19} aria-hidden="true" />}><ul className="space-y-3">{variant.unitMaterials.map(row => <PackagingRow key={row.id} material={row.usedUnitMaterial} quantity={t("productDetails.perUnit", { value: format(row.quantityPerUnit) })} group={row.optionGroupCatalog?.displayName ?? row.optionGroup} isDefault={row.isDefault} isActive={row.isActive} />)}</ul></Section>}
            {variant.intermediateMaterials.length > 0 && <Section title={t("productDetails.intermediatePackaging")} icon={<Layers3 size={19} aria-hidden="true" />}><ul className="space-y-3">{variant.intermediateMaterials.map(row => <PackagingRow key={row.id} material={row.usedIntermediateMaterial} quantity={t("productDetails.perIntermediate")} group={row.optionGroup} isDefault={row.isDefault} isActive={row.isActive} />)}</ul></Section>}
            {variant.palletMaterials.length > 0 && <Section title={t("productDetails.palletPackaging")} icon={<Boxes size={19} aria-hidden="true" />}><ul className="space-y-3">{variant.palletMaterials.map(row => <PackagingRow key={row.id} material={row.usedPalletMaterial} quantity={t(row.quantityBasis === "per_box" ? "productDetails.perBox" : "productDetails.perPallet", { value: format(row.quantityValue) })} group={row.packagingGroup?.displayName ?? row.optionGroup} isDefault={row.isDefault} isActive={row.isActive} />)}</ul></Section>}
        </div></> : <p className="rounded-xl border border-dashed border-line p-5 text-sm text-ink-600">{t("productDetails.noPackaging")}</p>}
    </div>
}

export function ProductDetailsContent({ product }: Readonly<{ product: ProductDetails }>) {
    const { t } = useTranslation()
    const [variantId, setVariantId] = useState<number | null>(null)
    const variant = product.productVariants.find(row => row.id === variantId) ?? product.productVariants[0]
    return <div className="min-w-0 space-y-6">
        <header className="relative overflow-hidden rounded-panel border border-line bg-linear-to-br from-customize-mint via-surface to-accent-coral-bg p-5 sm:p-6">
            <div className="flex flex-col-reverse gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700"><Barcode size={16} aria-hidden="true" />{t("productDetails.fixedProduct")}</p>
                    <h2 className="mt-3 break-words text-2xl font-semibold leading-tight text-ink-900 sm:text-3xl">{product.displayName}</h2>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-600"><span className="min-w-0 break-words">{product.parentSubCategory?.parentCategory?.displayName ?? t("productDetails.unavailable")}</span><ChevronRight size={14} aria-hidden="true" /><span className="min-w-0 break-words">{product.parentSubCategory?.displayName ?? t("productDetails.unavailable")}</span></div>
                    <p className="mt-3 flex items-start gap-2 text-sm text-ink-900"><Building2 size={17} className="mt-0.5 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words"><span className="text-ink-600">{t("productDetails.client")}: </span>{product.client?.name ?? t("productDetails.unavailable")}</span></p>
                    <div className="mt-4 flex flex-wrap items-center gap-2"><StatusBadge isActive={product.isActive} /><span className="rounded-full border border-brand-300 bg-customize-mint px-3 py-1 text-xs font-medium text-brand-700">{t(product.isOrganic ? "productDetails.organic" : "productDetails.conventional")}</span></div>
                </div>
                {product.imageUrl && <img src={product.imageUrl} alt={product.displayName} className="size-28 shrink-0 self-start rounded-2xl border border-line bg-surface object-contain sm:size-36" />}
            </div>
            <dl className="mt-6 grid grid-cols-1 gap-3 min-[400px]:grid-cols-3">
                <Metric label={t("productDetails.presentations")} value={product.productVariants.length} />
                <Metric label={t("productDetails.rawMaterials")} value={product.productRawMaterials.length} />
                <Metric label={t("productDetails.ingredients")} value={product.productIngredients.length} />
            </dl>
            <MaterialCost cost={product.additionalCostPerUnit} unit={t("productDetails.finishedUnit")} label={t("productDetails.additionalCost")} />
        </header>
        <Recipe product={product} />
        <section className="min-w-0 space-y-4" aria-label={t("productDetails.presentations")}>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-ink-900"><Scale size={21} aria-hidden="true" />{t("productDetails.presentations")}</h3>
            {!variant && <p className="rounded-xl border border-dashed border-line p-5 text-sm text-ink-600">{t("productDetails.noVariants")}</p>}
            {product.productVariants.length > 1 && <div><label htmlFor={`product-variant-${product.id}`} className="mb-2 block text-sm font-medium text-ink-900">{t("productDetails.choosePresentation")}</label>
                <select id={`product-variant-${product.id}`} className="h-control w-full min-w-0 max-w-full rounded-control border border-line bg-surface px-3 text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" value={variant?.id ?? ""} onChange={event => setVariantId(Number(event.target.value))}>
                    {product.productVariants.map(row => <option key={row.id} value={row.id}>{row.sizePresentation?.displayLabel ?? t("productDetails.unavailable")} · {row.skuCode}{!row.isActive ? ` · ${t("common.inactive")}` : ""}</option>)}
                </select></div>}
            {variant && <VariantDetails key={variant.id} variant={variant} />}
        </section>
    </div>
}

export function ProductDetailsModal({ productId, onClose }: Readonly<{ productId: number; onClose: () => void }>) {
    const { t } = useTranslation()
    const query = useQuery({ queryKey: ["fixedProductDetails", productId], queryFn: () => getFixedProductDetailsAPI(productId), retry: false })
    return <Modal title={t("productDetails.title")} size="wide" scrollBody onClose={onClose}>
        {query.isPending && <div className="space-y-4 py-4" role="status"><p className="text-sm text-ink-600">{t("common.loading")}</p><div className="h-44 rounded-panel bg-canvas" /><div className="grid gap-4 sm:grid-cols-2"><div className="h-56 rounded-panel bg-canvas" /><div className="h-56 rounded-panel bg-canvas" /></div></div>}
        {query.isError && <div className="rounded-panel border border-danger-border bg-danger-bg p-5" role="alert"><AlertCircle className="mb-3 text-danger" aria-hidden="true" /><p className="text-danger">{t("productDetails.loadError")}</p><Button variant="secondary" className="mt-4" onClick={() => { void query.refetch() }}>{t("productDetails.retry")}</Button></div>}
        {query.data && <ProductDetailsContent key={productId} product={query.data.data} />}
    </Modal>
}
