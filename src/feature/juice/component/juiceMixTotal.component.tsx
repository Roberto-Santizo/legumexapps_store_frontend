import { useTranslation } from "react-i18next"

// Calculated recipe total (saved rows, or saved rows plus the value being typed); only exactly 100% is ready for costing.
export function JuiceMixTotal({ total }: Readonly<{ total: number }>) {
    const { t } = useTranslation()
    const isComplete = total === 100
    return <output className={`mb-4 block text-sm ${isComplete ? "text-success" : "text-danger"}`}>{t("juice.mixTotal", { total })} · {t(isComplete ? "juice.mixReady" : "juice.mixIncomplete")}</output>
}
