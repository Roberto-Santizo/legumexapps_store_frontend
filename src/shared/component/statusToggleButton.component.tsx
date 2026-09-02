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
            className={`font-medium underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                    ? "text-error-fg decoration-error-fg hover:text-error-fg/80"
                    : "text-exito-fg decoration-exito-fg hover:text-exito-fg/80"
            }`}
        >
            {isActive ? t("common.deactivate") : t("common.activate")}
        </button>
    )
}
