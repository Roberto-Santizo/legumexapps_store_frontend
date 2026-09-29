import { useTranslation } from "react-i18next"
import type { QuoteDraftState } from "@/feature/quoteDraft/schema/quoteDraft.schema"

const STATE_CLASSES: Record<QuoteDraftState, string> = {
    in_progress: "border-info-bd bg-info-bg text-info-fg",
    abandoned: "border-aviso-bd bg-aviso-bg text-aviso-fg",
}

export function QuoteDraftStateBadge({ state }: Readonly<{ state: QuoteDraftState }>) {
    const { t } = useTranslation()

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STATE_CLASSES[state]}`}
        >
            {t(`quoteDraft.state.${state}`)}
        </span>
    )
}
