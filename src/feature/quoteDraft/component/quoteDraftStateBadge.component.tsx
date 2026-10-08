import { useTranslation } from "react-i18next"
import { statusPillClassName } from "@/shared/component/statusPillClassName"
import type { StatusPillTone } from "@/shared/component/statusPillClassName"
import type { QuoteDraftState } from "@/feature/quoteDraft/schema/quoteDraft.schema"

const STATE_TONES: Record<QuoteDraftState, StatusPillTone> = {
    in_progress: "info",
    abandoned: "warning",
}

export function QuoteDraftStateBadge({ state }: Readonly<{ state: QuoteDraftState }>) {
    const { t } = useTranslation()

    return (
        <span
            className={statusPillClassName(STATE_TONES[state])}
        >
            {t(`quoteDraft.state.${state}`)}
        </span>
    )
}
