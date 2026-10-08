import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { PackagingConsumptionFields } from "./packagingConsumptionFields.component"
import { PackagingBaseFields } from "./packagingBaseFields.component"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createPackagingSchema } from "@/feature/packaging/schema/packaging.schema"
import type { CreatePackagingInput, PackagingResponse } from "@/feature/packaging/schema/packaging.schema"
import { createPackagingAPI } from "@/feature/packaging/api/packaging.api"
import type { CatalogCreateModalProps } from "@/shared/component/catalogCreatableSelect.component"
import { Modal } from "@/shared/component/modal.component"
import { Button } from "@/shared/component/button.component"

export type PackagingMaterialRole = "unit" | "pallet"

const MODAL_TITLE_KEYS: Record<PackagingMaterialRole, string> = {
    unit: "productVariantUnitMaterial.createModal.title",
    pallet: "productVariantPalletMaterial.createModal.title",
}

type CreatePackagingMaterialModalProps = CatalogCreateModalProps<PackagingResponse> & {
    role: PackagingMaterialRole
}

// Alta rápida que PackagingMaterialSelect abre cuando el usuario tipea un material (individual o de
// palet) que no existe en el catálogo. A diferencia de CreateRawMaterialModal/CreatePresentationModal,
// NO reusa PackagingForm completo -- ese form deja elegir packagingRole (unit/intermediate/pallet),
// pero el selector filtra por un rol específico. Si dejáramos elegir el rol y el usuario pusiera
// otro, el registro se crearía pero jamás volvería a aparecer en ese selector -- así que el rol queda
// fijo y solo se piden code + displayName + unitCost (code es obligatorio en el schema -- ver
// createPackagingSchema -- así que este modal también debe pedirlo, o el submit fallaría siempre
// por falta de código). Los materiales de palet piden además su consumo por defecto.
export function CreatePackagingMaterialModal({ role, initialDisplayName, onCreated, onClose }: Readonly<CreatePackagingMaterialModalProps>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreatePackagingInput>({
        resolver: zodResolver(createPackagingSchema),
        defaultValues: { displayName: initialDisplayName, packagingRole: role },
    })

    const createMutation = useMutation({
        mutationFn: createPackagingAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["packagings"] })
            toast.success(data.message)
            onCreated(data.data)
        },
        onError: (error) => showErrorToast(error),
    })

    const onSubmit = handleSubmit((formData) => {
        createMutation.mutate(formData)
    })

    return (
        <Modal title={t(MODAL_TITLE_KEYS[role])} onClose={onClose}>
            <form onSubmit={onSubmit}>
                <input type="hidden" {...register("packagingRole")} />

                <PackagingBaseFields register={register} errors={errors} idPrefix={`${role}Material-`} />

                {role === "pallet" && <PackagingConsumptionFields register={register} errors={errors} />}
                <div className="flex gap-3">
                    <Button type="submit" disabled={createMutation.isPending}>
                        {createMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                    <Button type="button" variant="secondary" onClick={onClose}>
                        {t("common.cancel")}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
