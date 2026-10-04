import { useTranslation } from "react-i18next"

type StatusToggleButtonProps = {
    isActive: boolean
    isPending: boolean
    onToggle: () => void
}

export function StatusToggleButton({ isActive, isPending, onToggle }: Readonly<StatusToggleButtonProps>) {
    const { t } = useTranslation()

    return (
        <button
            type="button"
            disabled={isPending}
            onClick={onToggle}
            className={`rounded-action font-medium underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                    ? "text-danger decoration-danger hover:text-danger/80"
                    : "text-success decoration-success hover:text-success/80"
            }`}
        >
            {isActive ? t("common.deactivate") : t("common.activate")}
        </button>
    )
}
