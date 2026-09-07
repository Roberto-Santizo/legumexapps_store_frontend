import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createIngredientSchema } from "@/feature/ingredient/schema/ingredient.schema"
import type { CreateIngredientInput, IngredientResponse } from "@/feature/ingredient/schema/ingredient.schema"
import { createIngredientAPI } from "@/feature/ingredient/api/ingredient.api"
import { IngredientForm } from "@/feature/ingredient/component/ingredientForm.component"
import { Modal } from "@/shared/component/modal.component"
import { Button } from "@/shared/component/button.component"

type CreateIngredientModalProps = {
    initialDisplayName: string
    onCreated: (ingredient: IngredientResponse) => void
    onClose: () => void
}

// Alta rápida que IngredientSelect abre cuando el usuario tipea un ingrediente que no existe en
// el catálogo (ver ingredientSelect.component.tsx). Reusa IngredientForm tal cual -- misma
// validación y mismos campos requeridos que la página de creación normal (costPerUnit/costUnitId
// son obligatorios: sin ellos el ingrediente "costaría" $0 en el cotizador sin ningún aviso, ver
// ingredient.schema.ts y el comentario en productIngredientSection.component.tsx).
export function CreateIngredientModal({ initialDisplayName, onCreated, onClose }: Readonly<CreateIngredientModalProps>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateIngredientInput>({
        resolver: zodResolver(createIngredientSchema),
        defaultValues: { displayName: initialDisplayName },
    })

    const createMutation = useMutation({
        mutationFn: createIngredientAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["ingredients"] })
            toast.success(data.message)
            onCreated(data.data)
        },
        onError: (error) => toast.error(error.message),
    })

    const onSubmit = handleSubmit((formData) => {
        createMutation.mutate(formData)
    })

    return (
        <Modal title={t("ingredient.create.title")} onClose={onClose}>
            <form onSubmit={onSubmit}>
                <IngredientForm register={register} errors={errors} />
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
