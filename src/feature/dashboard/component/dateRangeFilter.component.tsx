import { useTranslation } from "react-i18next"
import { Card } from "@/shared/component/card.component"
import { Input } from "@/shared/component/input.component"
import type { DashboardDateRange } from "@/feature/dashboard/schema/dashboard.schema"
import { presetRange } from "@/feature/dashboard/util/presetRange"

interface DateRangeFilterProps {
    value: DashboardDateRange
    onChange: (range: DashboardDateRange) => void
}

const ALL_TIME_RANGE: DashboardDateRange = { startDate: null, endDate: null }

export function DateRangeFilter({ value, onChange }: Readonly<DateRangeFilterProps>) {
    const { t } = useTranslation()

    const presets = [
        { labelKey: "dashboard.filters.presets.last7", range: presetRange(7) },
        { labelKey: "dashboard.filters.presets.last30", range: presetRange(30) },
        { labelKey: "dashboard.filters.presets.last90", range: presetRange(90) },
        { labelKey: "dashboard.filters.presets.allTime", range: ALL_TIME_RANGE },
    ]

    const isActivePreset = (range: DashboardDateRange) => range.startDate === value.startDate && range.endDate === value.endDate

    return (
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                    <button
                        key={preset.labelKey}
                        type="button"
                        onClick={() => onChange(preset.range)}
                        className={`rounded-btn px-4 py-2 text-sm font-semibold transition ${
                            isActivePreset(preset.range)
                                ? "bg-verde-tinta text-dorado"
                                : "bg-crema text-verde-profundo hover:bg-gris-campo"
                        }`}
                    >
                        {t(preset.labelKey)}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm">
                    <span className="mb-1 block font-medium text-texto-suave">{t("dashboard.filters.startDate")}</span>
                    <Input
                        type="date"
                        preserveCase
                        value={value.startDate ?? ""}
                        max={value.endDate ?? undefined}
                        onChange={(event) => onChange({ ...value, startDate: event.target.value || null })}
                        className="w-auto"
                    />
                </label>
                <label className="text-sm">
                    <span className="mb-1 block font-medium text-texto-suave">{t("dashboard.filters.endDate")}</span>
                    <Input
                        type="date"
                        preserveCase
                        value={value.endDate ?? ""}
                        min={value.startDate ?? undefined}
                        onChange={(event) => onChange({ ...value, endDate: event.target.value || null })}
                        className="w-auto"
                    />
                </label>
            </div>
        </Card>
    )
}
