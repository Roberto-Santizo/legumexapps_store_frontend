import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { updateRawMaterialSchema } from "@/feature/rawMaterial/schema/rawMaterial.schema"
import type { RawMaterialResponse, UpdateRawMaterialInput } from "@/feature/rawMaterial/schema/rawMaterial.schema"
import { getRawMaterialByIdAPI, updateRawMaterialAPI } from "@/feature/rawMaterial/api/rawMaterial.api"
import { RawMaterialForm } from "@/feature/rawMaterial/component/rawMaterialForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

// Partial<UpdateRawMaterialInput> y no UpdateRawMaterialInput: costPerUnit es requerido para
// GUARDAR, pero un registro viejo de antes de esa regla puede seguir teniendo null en la BD --
// hay que poder precargar el form vacío en ese campo para que el admin lo complete, no forzar un
// valor que no existe. costUnitId no es parte del form -- se fuerza server-side a la Libra.
function toFormValues(rawMaterial: RawMaterialResponse): Partial<UpdateRawMaterialInput> {
    // Ver el mismo comentario en editCategory.page.tsx::toFormValues.
    const englishTranslation = rawMaterial.translations.find((translation) => translation.language === "en")
    return {
        code: rawMaterial.code,
        displayName: rawMaterial.displayName,
        ingredientType: rawMaterial.ingredientType,
        isOrganic: rawMaterial.isOrganic,
        isMixable: rawMaterial.isMixable,
        costPerUnit: rawMaterial.costPerUnit ?? undefined,
        translations: {
            en: { displayName: englishTranslation?.displayName ?? "" },
        },
    }
}

export function EditRawMaterialPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const params = useParams()
    const rawMaterialId = Number(params.rawMaterialId)

    const rawMaterialQuery = useQuery({
        queryKey: ["rawMaterial", rawMaterialId],
        queryFn: () => getRawMaterialByIdAPI(rawMaterialId),
        retry: false,
    })

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateRawMaterialInput>({
        resolver: zodResolver(updateRawMaterialSchema),
    })

    useEffect(() => {
        if (rawMaterialQuery.data) {
            reset(toFormValues(rawMaterialQuery.data.data))
        }
    }, [rawMaterialQuery.data, reset])

    const updateRawMaterialMutation = useMutation({
        mutationFn: (formData: UpdateRawMaterialInput) => updateRawMaterialAPI(rawMaterialId, formData),
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
        updateRawMaterialMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("rawMaterial.edit.title")}</h1>
                <Link to="/admin/raw-materials" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                {rawMaterialQuery.isLoading && <p className="text-texto-suave">{t("common.loading")}</p>}
                {rawMaterialQuery.isError && <p className="text-error-fg">{t("common.loadError")}</p>}

                {rawMaterialQuery.data && (
                    <form onSubmit={onSubmit}>
                        <RawMaterialForm register={register} errors={errors} />
                        <Button type="submit" disabled={updateRawMaterialMutation.isPending}>
                            {updateRawMaterialMutation.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                    </form>
                )}
            </Card>
        </PageContainer>
    )
}
