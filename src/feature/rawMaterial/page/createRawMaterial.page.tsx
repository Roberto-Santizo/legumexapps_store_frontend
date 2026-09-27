import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createRawMaterialSchema } from "@/feature/rawMaterial/schema/rawMaterial.schema"
import type { CreateRawMaterialInput } from "@/feature/rawMaterial/schema/rawMaterial.schema"
import { createRawMaterialAPI } from "@/feature/rawMaterial/api/rawMaterial.api"
import { RawMaterialForm } from "@/feature/rawMaterial/component/rawMaterialForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreateRawMaterialPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateRawMaterialInput>({
        resolver: zodResolver(createRawMaterialSchema),
    })

    const createRawMaterialMutation = useMutation({
        mutationFn: createRawMaterialAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["rawMaterials"] })
            toast.success(data.message)
            navigate("/admin/raw-materials")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        createRawMaterialMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("rawMaterial.create.title")}</h1>
                <Link to="/admin/raw-materials" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <RawMaterialForm register={register} errors={errors} />
                    <Button type="submit" disabled={createRawMaterialMutation.isPending}>
                        {createRawMaterialMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
