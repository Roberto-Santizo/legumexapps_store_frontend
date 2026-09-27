import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createRawMaterialSchema } from "@/feature/rawMaterial/schema/rawMaterial.schema"
import type { CreateRawMaterialInput, RawMaterialResponse } from "@/feature/rawMaterial/schema/rawMaterial.schema"
import { createRawMaterialAPI } from "@/feature/rawMaterial/api/rawMaterial.api"
import { RawMaterialForm } from "@/feature/rawMaterial/component/rawMaterialForm.component"
import { Modal } from "@/shared/component/modal.component"
import { Button } from "@/shared/component/button.component"

type CreateRawMaterialModalProps = {
    initialDisplayName: string
    onCreated: (rawMaterial: RawMaterialResponse) => void
    onClose: () => void
}

// Alta rápida que RawMaterialSelect abre cuando el usuario tipea una materia prima que no existe
// en el catálogo (ver rawMaterialSelect.component.tsx). Reusa RawMaterialForm tal cual -- misma
// validación y mismos campos requeridos que la página de creación normal (costPerUnit es
// obligatorio: sin él la materia prima "costaría" $0 en el cotizador sin ningún aviso, ver
// rawMaterial.schema.ts y el comentario en productRawMaterialSection.component.tsx).
export function CreateRawMaterialModal({ initialDisplayName, onCreated, onClose }: Readonly<CreateRawMaterialModalProps>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateRawMaterialInput>({
        resolver: zodResolver(createRawMaterialSchema),
        defaultValues: { displayName: initialDisplayName },
    })

    const createMutation = useMutation({
        mutationFn: createRawMaterialAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["rawMaterials"] })
            toast.success(data.message)
            onCreated(data.data)
        },
        onError: (error) => toast.error(error.message),
    })

    const onSubmit = handleSubmit((formData) => {
        createMutation.mutate(formData)
    })

    return (
        <Modal title={t("rawMaterial.create.title")} onClose={onClose}>
            <form onSubmit={onSubmit}>
                <RawMaterialForm register={register} errors={errors} />
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
