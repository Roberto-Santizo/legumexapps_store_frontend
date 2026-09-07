import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createPresentationSchema } from "@/feature/presentation/schema/presentation.schema"
import type { CreatePresentationInput, PresentationResponse } from "@/feature/presentation/schema/presentation.schema"
import { createPresentationAPI } from "@/feature/presentation/api/presentation.api"
import { PresentationForm } from "@/feature/presentation/component/presentationForm.component"
import { Modal } from "@/shared/component/modal.component"
import { Button } from "@/shared/component/button.component"

type CreatePresentationModalProps = {
    initialDisplayLabel: string
    onCreated: (presentation: PresentationResponse) => void
    onClose: () => void
}

// Alta rápida que PresentationSelect abre cuando el usuario tipea una presentación que no existe
// en el catálogo (ver presentationSelect.component.tsx). Reusa PresentationForm tal cual -- misma
// validación que la página de creación normal (netWeightGrams es obligatorio: es el peso físico
// real que alimenta el cálculo de % en productos personalizables, ver presentation.schema.ts).
export function CreatePresentationModal({ initialDisplayLabel, onCreated, onClose }: Readonly<CreatePresentationModalProps>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<CreatePresentationInput>({
        resolver: zodResolver(createPresentationSchema),
        defaultValues: { displayLabel: initialDisplayLabel },
    })

    const createMutation = useMutation({
        mutationFn: createPresentationAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["presentations"] })
            toast.success(data.message)
            onCreated(data.data)
        },
        onError: (error) => toast.error(error.message),
    })

    const onSubmit = handleSubmit((formData) => {
        createMutation.mutate(formData)
    })

    return (
        <Modal title={t("presentation.create.title")} onClose={onClose}>
            <form onSubmit={onSubmit}>
                <PresentationForm register={register} control={control} errors={errors} />
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
