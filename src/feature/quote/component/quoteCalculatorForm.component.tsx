import { useEffect, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ChevronRight, Package, SlidersHorizontal } from "lucide-react"
import { calculateQuoteSchema } from "@/feature/quote/schema/quote.schema"
import type { CalculateQuoteInput, QuotableProduct, QuoteDestination } from "@/feature/quote/schema/quote.schema"
import type { DestinationCountry } from "@/feature/destination/schema/destination.schema"
import { Card } from "@/shared/component/card.component"
import { Chip } from "@/shared/component/chip.component"
import { FormField } from "@/shared/component/formField.component"
import { Select } from "@/shared/component/select.component"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { OptionCards } from "@/shared/component/optionCards.component"
import type { CardOption } from "@/shared/component/optionCards.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

type QuoteCalculatorFormProps = {
    products: QuotableProduct[]
    destinations: QuoteDestination[]
    onSubmit: (formData: CalculateQuoteInput) => void
    isSubmitting: boolean
    onStepChange?: (step: QuoteWizardStep) => void
}

const MIX_PERCENTAGE_TOLERANCE = 0.5

type QuoteMode = "finished" | "customizable"

export type QuoteWizardStep = "mode" | "category" | "product" | "details"

function variantLabel(variant: QuotableProduct["variants"][number]): string {
    return [variant.presentationLabel, variant.packagingLabel, variant.skuCode].filter(Boolean).join(" · ")
}

function crumbClassName(isActive: boolean, enabled: boolean): string {
    if (isActive) return "text-verde-profundo"
    if (enabled) return "text-texto-suave hover:text-verde-profundo"
    return "cursor-not-allowed text-gris-campo"
}

export function QuoteCalculatorForm({ products, destinations, onSubmit, isSubmitting, onStepChange }: Readonly<QuoteCalculatorFormProps>) {
    const { t } = useTranslation()
    const [step, setStep] = useState<QuoteWizardStep>("mode")
    const [mode, setMode] = useState<QuoteMode>("finished")
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
    const [mixPercentages, setMixPercentages] = useState<Record<number, string>>({})
    const [selectedCountry, setSelectedCountry] = useState<DestinationCountry>("GT")

    useEffect(() => {
        onStepChange?.(step)
    }, [step, onStepChange])

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<CalculateQuoteInput>({ resolver: zodResolver(calculateQuoteSchema) })

    const modeProducts = useMemo(
        () => products.filter((product) => product.isCustomizable === (mode === "customizable")),
        [products, mode]
    )
    const categories = useMemo(() => {
        const byId = new Map<number, CardOption>()
        modeProducts.forEach((product) => {
            if (!byId.has(product.categoryId)) {
                byId.set(product.categoryId, { value: product.categoryId, text: product.categoryName, imageUrl: product.categoryImageUrl })
            }
        })
        return [...byId.values()].sort((a, b) => a.text.localeCompare(b.text))
    }, [modeProducts])

    const selectedCategory = categories.find((category) => category.value === selectedCategoryId)

    const categoryProducts = useMemo(
        () => modeProducts.filter((product) => product.categoryId === selectedCategoryId),
        [modeProducts, selectedCategoryId]
    )
    const productCardOptions: CardOption[] = categoryProducts.map((product) => ({
        value: product.id,
        text: product.displayName,
        imageUrl: product.imageUrl,
        subtitle: product.productTypeName ?? undefined,
        badge: product.isOrganic ? (
            <span className="inline-flex items-center rounded-chip bg-brote px-2 py-1 text-xs font-semibold text-verde-profundo shadow-sm">
                {t("site.quoteRequest.form.organicBadge")}
            </span>
        ) : undefined,
    }))

    const selectedProduct = categoryProducts.find((product) => product.id === selectedProductId)
    const variants = selectedProduct?.variants ?? []
    const ingredientPool = selectedProduct?.ingredientPool ?? []

    const destinationOptions: SearchableSelectOption[] = destinations
        .filter((destination) => destination.country === selectedCountry)
        .map((destination) => ({
            value: destination.id,
            label: destination.displayName,
        }))

    const mixTotal = ingredientPool.reduce((sum, option) => sum + (Number(mixPercentages[option.ingredientId]) || 0), 0)
    const isMixComplete = Math.abs(mixTotal - 100) <= MIX_PERCENTAGE_TOLERANCE

    const resetProductSelection = () => {
        setSelectedProductId(null)
        setValue("productVariantId", undefined as unknown as number)
        setMixPercentages({})
    }

    const handleModeChange = (nextMode: QuoteMode) => {
        if (nextMode !== mode) {
            setMode(nextMode)
            setSelectedCategoryId(null)
            resetProductSelection()
        }
        setStep("category")
    }

    const handleCategoryChange = (categoryId: number) => {
        setSelectedCategoryId(categoryId)
        resetProductSelection()
        setStep("product")
    }

    const handleProductChange = (productId: number) => {
        setSelectedProductId(productId)
        setValue("productVariantId", undefined as unknown as number)
        setMixPercentages({})
        setStep("details")
    }

    const handleMixPercentageChange = (ingredientId: number, value: string) => {
        setMixPercentages((current) => ({ ...current, [ingredientId]: value }))
    }

    const handleCountryChange = (country: DestinationCountry) => {
        setSelectedCountry(country)
        setValue("destinationId", undefined as unknown as number)
    }

    const submit = handleSubmit((formData) => {
        if (mode !== "customizable") {
            onSubmit(formData)
            return
        }
        const ingredientMix = ingredientPool
            .map((option) => ({ ingredientId: option.ingredientId, percentage: Number(mixPercentages[option.ingredientId]) || 0 }))
            .filter((line) => line.percentage > 0)
        onSubmit({ ...formData, ingredientMix })
    })

    const crumbs: { key: QuoteWizardStep; label: string; enabled: boolean }[] = [
        { key: "mode", label: t("site.quoteRequest.form.wizard.steps.mode"), enabled: true },
        { key: "category", label: t("site.quoteRequest.form.wizard.steps.category"), enabled: true },
        { key: "product", label: t("site.quoteRequest.form.wizard.steps.product"), enabled: selectedCategoryId !== null },
        { key: "details", label: t("site.quoteRequest.form.wizard.steps.details"), enabled: selectedProductId !== null },
    ]

    return (
        <Card>
            <div className="mb-5 flex items-center gap-2">
                <Package className="h-5 w-5 text-dorado" />
                <h2 className="font-display text-lg font-bold text-verde-profundo">{t("site.quoteRequest.form.title")}</h2>
            </div>

            <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm">
                {crumbs.map((crumb, index) => (
                    <div key={crumb.key} className="flex items-center gap-1.5">
                        {index > 0 && <ChevronRight size={14} className="text-gris-campo" />}
                        <button
                            type="button"
                            disabled={!crumb.enabled}
                            onClick={() => setStep(crumb.key)}
                            className={`font-medium transition ${crumbClassName(step === crumb.key, crumb.enabled)}`}
                        >
                            {crumb.label}
                        </button>
                    </div>
                ))}
            </nav>

            <form onSubmit={submit}>
                {step === "mode" && (
                    <div>
                        <p className="mb-1 font-display text-base font-bold text-verde-profundo">
                            {t("site.quoteRequest.form.wizard.mode.title")}
                        </p>
                        <p className="mb-5 text-sm text-texto-suave">{t("site.quoteRequest.form.wizard.mode.subtitle")}</p>
                        <OptionCards
                            options={[
                                {
                                    value: "finished",
                                    text: t("site.quoteRequest.form.modeFinished"),
                                    subtitle: t("site.quoteRequest.form.modeFinishedHint"),
                                    icon: <Package size={22} />,
                                },
                                {
                                    value: "customizable",
                                    text: t("site.quoteRequest.form.modeCustomizable"),
                                    subtitle: t("site.quoteRequest.form.modeCustomizableHint"),
                                    icon: <SlidersHorizontal size={22} />,
                                },
                            ]}
                            value={mode}
                            onChange={(value) => handleModeChange(value as QuoteMode)}
                            columnsClassName="grid-cols-1 sm:grid-cols-2"
                            imageHeightClassName="h-16"
                        />
                    </div>
                )}

                {step === "category" && (
                    <div>
                        <button
                            type="button"
                            onClick={() => setStep("mode")}
                            className="mb-4 flex items-center gap-1 text-sm text-texto-suave transition hover:text-verde-profundo"
                        >
                            <ArrowLeft size={14} />
                            {t("site.quoteRequest.form.wizard.back")}
                        </button>
                        <p className="mb-1 font-display text-base font-bold text-verde-profundo">
                            {t("site.quoteRequest.form.wizard.category.title")}
                        </p>
                        <p className="mb-5 text-sm text-texto-suave">{t("site.quoteRequest.form.wizard.category.subtitle")}</p>

                        {categories.length === 0 ? (
                            <p className="text-sm text-texto-suave">
                                {mode === "finished" ? t("site.quoteRequest.form.noProductsFinished") : t("site.quoteRequest.form.noProductsCustomizable")}
                            </p>
                        ) : (
                            <OptionCards
                                options={categories}
                                value={selectedCategoryId}
                                onChange={(value) => handleCategoryChange(Number(value))}
                                columnsClassName="grid-cols-2 sm:grid-cols-3"
                                imageHeightClassName="h-44 sm:h-56"
                            />
                        )}
                    </div>
                )}

                {step === "product" && selectedCategoryId !== null && (
                    <div>
                        <button
                            type="button"
                            onClick={() => setStep("category")}
                            className="mb-4 flex items-center gap-1 text-sm text-texto-suave transition hover:text-verde-profundo"
                        >
                            <ArrowLeft size={14} />
                            {t("site.quoteRequest.form.wizard.back")}
                        </button>
                        <p className="mb-1 font-display text-base font-bold text-verde-profundo">
                            {t("site.quoteRequest.form.wizard.product.title", { category: selectedCategory?.text ?? "" })}
                        </p>
                        <p className="mb-5 text-sm text-texto-suave">{t("site.quoteRequest.form.wizard.product.subtitle")}</p>

                        {productCardOptions.length === 0 ? (
                            <p className="text-sm text-texto-suave">
                                {mode === "finished" ? t("site.quoteRequest.form.noProductsFinished") : t("site.quoteRequest.form.noProductsCustomizable")}
                            </p>
                        ) : (
                            <OptionCards
                                options={productCardOptions}
                                value={selectedProductId}
                                onChange={(value) => handleProductChange(Number(value))}
                                columnsClassName="grid-cols-2 sm:grid-cols-3"
                                imageHeightClassName="h-44 sm:h-56"
                            />
                        )}
                    </div>
                )}

                {step === "details" && selectedProduct && (
                    <div>
                        <button
                            type="button"
                            onClick={() => setStep("product")}
                            className="mb-4 flex items-center gap-1 text-sm text-texto-suave transition hover:text-verde-profundo"
                        >
                            <ArrowLeft size={14} />
                            {t("site.quoteRequest.form.wizard.back")}
                        </button>

                        <div className="mb-5 flex items-center gap-3 rounded-[10px] border border-gris-campo bg-crema/40 p-3">
                            {selectedProduct.imageUrl ? (
                                <img
                                    src={selectedProduct.imageUrl}
                                    alt=""
                                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gris-campo/20 text-texto-suave">
                                    <Package size={20} />
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-texto-suave">{selectedCategory?.text}</p>
                                <p className="font-semibold text-verde-profundo">{selectedProduct.displayName}</p>
                            </div>
                        </div>

                        {(selectedProduct.productTypeName || selectedProduct.isOrganic) && (
                            <div className="mb-5 flex flex-wrap gap-2">
                                {selectedProduct.productTypeName && <Chip>{selectedProduct.productTypeName}</Chip>}
                                {selectedProduct.isOrganic && (
                                    <Chip tone="fresh">{t("site.quoteRequest.form.organicBadge")}</Chip>
                                )}
                            </div>
                        )}

                        {mode === "customizable" && (
                            <div className="mb-5 rounded-[10px] border border-gris-campo p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-verde-profundo">{t("site.quoteRequest.form.mixTitle")}</p>
                                    <p className={`text-sm font-semibold ${isMixComplete ? "text-verde-profundo" : "text-error-fg"}`}>
                                        {t("site.quoteRequest.form.mixTotal", { total: mixTotal })}
                                    </p>
                                </div>

                                {ingredientPool.length === 0 ? (
                                    <p className="text-sm text-texto-suave">{t("site.quoteRequest.form.mixEmpty")}</p>
                                ) : (
                                    <div className="space-y-3">
                                        {ingredientPool.map((option) => (
                                            <div key={option.ingredientId} className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm text-verde-profundo">{option.displayName}</p>
                                                        <Chip tone={option.isOrganic ? "fresh" : "neutral"}>
                                                            {option.isOrganic ? t("ingredient.organicTag") : t("ingredient.conventionalTag")}
                                                        </Chip>
                                                    </div>
                                                    <p className="text-xs text-texto-suave">
                                                        {t("site.quoteRequest.form.mixRange", {
                                                            min: option.minPercentage,
                                                            max: option.maxPercentage,
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="flex w-24 items-center gap-1">
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        min={option.minPercentage}
                                                        max={option.maxPercentage}
                                                        value={mixPercentages[option.ingredientId] ?? ""}
                                                        onChange={(event) => handleMixPercentageChange(option.ingredientId, event.target.value)}
                                                    />
                                                    <span className="text-sm text-texto-suave">%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {!isMixComplete && ingredientPool.length > 0 && (
                                    <p className="mt-3 text-xs text-error-fg">{t("site.quoteRequest.form.mixIncomplete")}</p>
                                )}
                            </div>
                        )}

                        <FormField
                            label={t("site.quoteRequest.form.variant")}
                            htmlFor="productVariantId"
                            error={getFieldErrorMessage(t, errors.productVariantId)}
                        >
                            <Select
                                id="productVariantId"
                                hasError={!!errors.productVariantId}
                                defaultValue=""
                                {...register("productVariantId", { setValueAs: toOptionalNumber })}
                            >
                                <option value="">{t("common.selectPlaceholder")}</option>
                                {variants.map((variant) => (
                                    <option key={variant.id} value={variant.id}>
                                        {variantLabel(variant)}
                                    </option>
                                ))}
                            </Select>
                        </FormField>

                        <FormField
                            label={t("site.quoteRequest.form.requestedPallets")}
                            htmlFor="requestedPallets"
                            error={getFieldErrorMessage(t, errors.requestedPallets)}
                        >
                            <Input
                                id="requestedPallets"
                                type="number"
                                min={1}
                                step={1}
                                defaultValue={1}
                                hasError={!!errors.requestedPallets}
                                {...register("requestedPallets", { setValueAs: toOptionalNumber })}
                            />
                        </FormField>

                        <FormField label={t("site.quoteRequest.form.country")} htmlFor="quoteCountry">
                            <Select
                                id="quoteCountry"
                                value={selectedCountry}
                                onChange={(event) => handleCountryChange(event.target.value as DestinationCountry)}
                            >
                                <option value="GT">{t("site.quoteRequest.form.countryOptions.GT")}</option>
                                <option value="US">{t("site.quoteRequest.form.countryOptions.US")}</option>
                            </Select>
                        </FormField>

                        <FormField
                            label={t("site.quoteRequest.form.destination")}
                            htmlFor="destinationId"
                            error={getFieldErrorMessage(t, errors.destinationId)}
                        >
                            {destinationOptions.length === 0 ? (
                                <p className="text-sm text-texto-suave">{t("site.quoteRequest.form.noDestinationsForCountry")}</p>
                            ) : (
                                <Controller
                                    name="destinationId"
                                    control={control}
                                    render={({ field }) => (
                                        <SearchableSelect
                                            inputId="destinationId"
                                            hasError={!!errors.destinationId}
                                            options={destinationOptions}
                                            placeholder={t("common.searchPlaceholder")}
                                            noOptionsMessage={() => t("common.noOptionsFound")}
                                            isClearable
                                            value={destinationOptions.find((option) => option.value === field.value) ?? null}
                                            onChange={(selected) => field.onChange(selected?.value ?? undefined)}
                                        />
                                    )}
                                />
                            )}
                        </FormField>

                        <Button
                            type="submit"
                            disabled={isSubmitting || (mode === "customizable" && !isMixComplete)}
                            className="mt-2 w-full"
                        >
                            {isSubmitting ? t("common.loading") : t("site.quoteRequest.form.submit")}
                        </Button>
                    </div>
                )}
            </form>
        </Card>
    )
}
