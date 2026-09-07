import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createPackagingSchema } from "@/feature/packaging/schema/packaging.schema"
import type { CreatePackagingInput, PackagingResponse } from "@/feature/packaging/schema/packaging.schema"
import { createPackagingAPI } from "@/feature/packaging/api/packaging.api"
import { Modal } from "@/shared/component/modal.component"
import { Button } from "@/shared/component/button.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

type CreatePalletMaterialModalProps = {
    initialDisplayName: string
    onCreated: (packaging: PackagingResponse) => void
    onClose: () => void
}

// Alta rápida que PalletMaterialSelect abre cuando el usuario tipea un material de palet que no
// existe en el catálogo (ver palletMaterialSelect.component.tsx). A diferencia de
// CreateIngredientModal/CreatePresentationModal, NO reusa PackagingForm completo -- ese form deja
// elegir packagingRole (unit/intermediate/pallet), pero este selector filtra específicamente por
// "pallet" (ver palletMaterialSelect.component.tsx). Si dejáramos elegir el rol y el usuario
// pusiera otro, el registro se crearía pero jamás volvería a aparecer en este selector -- así que
// el rol queda fijo en "pallet" y solo se piden displayName + unitCost.
export function CreatePalletMaterialModal({ initialDisplayName, onCreated, onClose }: Readonly<CreatePalletMaterialModalProps>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreatePackagingInput>({
        resolver: zodResolver(createPackagingSchema),
        defaultValues: { displayName: initialDisplayName, packagingRole: "pallet" },
    })

    const createMutation = useMutation({
        mutationFn: createPackagingAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["packagings"] })
            toast.success(data.message)
            onCreated(data.data)
        },
        onError: (error) => toast.error(error.message),
    })

    const onSubmit = handleSubmit((formData) => {
        createMutation.mutate(formData)
    })

    return (
        <Modal title={t("productVariantPalletMaterial.createModal.title")} onClose={onClose}>
            <form onSubmit={onSubmit}>
                <input type="hidden" {...register("packagingRole")} />

                <FormField
                    label={t("packaging.form.displayName")}
                    htmlFor="palletMaterialDisplayName"
                    error={getFieldErrorMessage(t, errors.displayName)}
                >
                    <Input id="palletMaterialDisplayName" hasError={!!errors.displayName} {...register("displayName")} />
                </FormField>

                <FormField
                    label={t("packaging.form.unitCost")}
                    htmlFor="palletMaterialUnitCost"
                    error={getFieldErrorMessage(t, errors.unitCost)}
                >
                    <Input
                        id="palletMaterialUnitCost"
                        type="number"
                        step="0.0001"
                        hasError={!!errors.unitCost}
                        {...register("unitCost", { setValueAs: toOptionalNumber })}
                    />
                </FormField>

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
