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

type CreateUnitMaterialModalProps = {
    initialDisplayName: string
    onCreated: (packaging: PackagingResponse) => void
    onClose: () => void
}

// Alta rápida que UnitMaterialSelect abre cuando el usuario tipea un material individual que no
// existe en el catálogo -- mismo patrón que createPalletMaterialModal.component.tsx (ver ese
// archivo para el razonamiento completo), solo que acá el rol queda fijo en "unit".
export function CreateUnitMaterialModal({ initialDisplayName, onCreated, onClose }: Readonly<CreateUnitMaterialModalProps>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreatePackagingInput>({
        resolver: zodResolver(createPackagingSchema),
        defaultValues: { displayName: initialDisplayName, packagingRole: "unit" },
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
        <Modal title={t("productVariantUnitMaterial.createModal.title")} onClose={onClose}>
            <form onSubmit={onSubmit}>
                <input type="hidden" {...register("packagingRole")} />

                <FormField
                    label={t("packaging.form.code")}
                    htmlFor="unitMaterialCode"
                    error={getFieldErrorMessage(t, errors.code)}
                >
                    <Input id="unitMaterialCode" required hasError={!!errors.code} {...register("code")} />
                </FormField>

                <FormField
                    label={t("packaging.form.displayName")}
                    htmlFor="unitMaterialDisplayName"
                    error={getFieldErrorMessage(t, errors.displayName)}
                >
                    <Input id="unitMaterialDisplayName" hasError={!!errors.displayName} {...register("displayName")} />
                </FormField>

                <FormField
                    label={t("packaging.form.unitCost")}
                    htmlFor="unitMaterialUnitCost"
                    error={getFieldErrorMessage(t, errors.unitCost)}
                >
                    <Input
                        id="unitMaterialUnitCost"
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
