import { useTranslation } from "react-i18next"
import { Button } from "@/shared/component/button.component"
import { Card } from "@/shared/component/card.component"
import { Input } from "@/shared/component/input.component"
import { SegmentedControl } from "@/shared/component/segmentedControl.component"
import type { DateRange } from "@/shared/schema/dateRange.schema"
import { presetRange } from "@/shared/utils/presetRange"

interface DateRangeFilterProps {
    value: DateRange
    onChange: (range: DateRange) => void
    // "toolbar": fila compacta sin tarjeta (presets segmentados + fechas), para encabezados de página.
    appearance?: "card" | "toolbar"
}

const ALL_TIME_RANGE: DateRange = { startDate: null, endDate: null }

export function DateRangeFilter({ value, onChange, appearance = "card" }: Readonly<DateRangeFilterProps>) {
    const { t } = useTranslation()

    const presets = [
        { labelKey: "common.dateRange.presets.last7", shortKey: "common.dateRange.presetsShort.last7", range: presetRange(7) },
        { labelKey: "common.dateRange.presets.last30", shortKey: "common.dateRange.presetsShort.last30", range: presetRange(30) },
        { labelKey: "common.dateRange.presets.last90", shortKey: "common.dateRange.presetsShort.last90", range: presetRange(90) },
        { labelKey: "common.dateRange.presets.allTime", shortKey: "common.dateRange.presetsShort.allTime", range: ALL_TIME_RANGE },
    ]

    const isActivePreset = (range: DateRange) => range.startDate === value.startDate && range.endDate === value.endDate

    const dateInputs = (
        <>
            <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-600">{t("common.dateRange.startDate")}</span>
                <Input
                    type="date"
                    preserveCase
                    value={value.startDate ?? ""}
                    max={value.endDate ?? undefined}
                    onChange={(event) => onChange({ ...value, startDate: event.target.value || null })}
                    className={appearance === "toolbar" ? "min-w-0" : "w-auto"}
                />
            </label>
            <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-600">{t("common.dateRange.endDate")}</span>
                <Input
                    type="date"
                    preserveCase
                    value={value.endDate ?? ""}
                    min={value.startDate ?? undefined}
                    onChange={(event) => onChange({ ...value, endDate: event.target.value || null })}
                    className={appearance === "toolbar" ? "min-w-0" : "w-auto"}
                />
            </label>
        </>
    )

    if (appearance === "toolbar") {
        const activeKey = presets.find(preset => isActivePreset(preset.range))?.labelKey ?? ""
        return (
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                    <span className="mb-1 block text-sm font-medium text-ink-600">{t("common.dateRange.period")}</span>
                    <SegmentedControl
                        label={t("common.dateRange.period")}
                        value={activeKey}
                        onChange={key => onChange(presets.find(preset => preset.labelKey === key)!.range)}
                        options={presets.map(preset => ({ value: preset.labelKey, label: t(preset.shortKey), title: t(preset.labelKey) }))}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3 md:flex md:items-end">{dateInputs}</div>
            </div>
        )
    }

    return (
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                    <Button
                        key={preset.labelKey}
                        type="button"
                        onClick={() => onChange(preset.range)}
                        variant={isActivePreset(preset.range) ? "primary" : "secondary"}
                    >
                        {t(preset.labelKey)}
                    </Button>
                ))}
            </div>

            <div className="flex flex-wrap items-end gap-3">{dateInputs}</div>
        </Card>
    )
}
