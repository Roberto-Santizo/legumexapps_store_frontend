import { useState } from "react"
import type { FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"

type PackagingSkuFilterProps = {
    appliedSkuCode: string | null
    onApply: (skuCode: string) => void
    onClear: () => void
}

// Barra de búsqueda "Empaques de este SKU" -- solo controla el input y el skuCode APLICADO
// (levantado a packaging.page.tsx), nunca dispara la búsqueda en cada tecla. La tabla resultante
// vive aparte (packagingSkuUsageTable.component.tsx) y reemplaza al catálogo completo mientras
// haya un filtro aplicado.
export function PackagingSkuFilter({ appliedSkuCode, onApply, onClear }: Readonly<PackagingSkuFilterProps>) {
    const { t } = useTranslation()
    const [skuCode, setSkuCode] = useState(appliedSkuCode ?? "")

    function handleSubmit(event: FormEvent) {
        event.preventDefault()
        const trimmed = skuCode.trim()
        if (trimmed) onApply(trimmed)
    }

    function handleClear() {
        setSkuCode("")
        onClear()
    }

    return (
        <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
                <label htmlFor="packagingSkuFilter" className="mb-1.5 block text-sm font-medium text-verde-profundo">
                    {t("packaging.skuFilter.label")}
                </label>
                <Input
                    id="packagingSkuFilter"
                    value={skuCode}
                    onChange={(event) => setSkuCode(event.target.value)}
                    placeholder={t("packaging.skuFilter.placeholder")}
                />
            </div>
            <div className="flex gap-2">
                <Button type="submit" disabled={!skuCode.trim()}>
                    {t("packaging.skuFilter.button")}
                </Button>
                {appliedSkuCode && (
                    <Button type="button" variant="secondary" onClick={handleClear}>
                        {t("packaging.skuFilter.clear")}
                    </Button>
                )}
            </div>
        </form>
    )
}
