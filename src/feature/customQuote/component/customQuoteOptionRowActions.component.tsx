import { useTranslation } from "react-i18next"
import { StatusToggleButton } from "@/shared/component/statusToggleButton.component"

type CustomQuoteOptionRowActionsProps = {
    isActive: boolean
    isStatusPending: boolean
    onEdit: () => void
    onToggleStatus: () => void
}

// Acciones de una fila de la configuración a la medida: editar (solo filas activas -- el backend no
// edita una desactivada) y activar/desactivar. No hay eliminar: la fila se desactiva y se puede
// reactivar (el backend rechaza crear una segunda fila para el mismo elemento).
export function CustomQuoteOptionRowActions({ isActive, isStatusPending, onEdit, onToggleStatus }: Readonly<CustomQuoteOptionRowActionsProps>) {
    const { t } = useTranslation()

    return (
        <div className="flex items-center gap-3">
            {isActive && (
                <button
                    type="button"
                    onClick={onEdit}
                    className="font-medium text-verde-profundo underline decoration-dorado underline-offset-4 hover:text-verde-tinta"
                >
                    {t("common.edit")}
                </button>
            )}
            <StatusToggleButton isActive={isActive} isPending={isStatusPending} onToggle={onToggleStatus} />
        </div>
    )
}
