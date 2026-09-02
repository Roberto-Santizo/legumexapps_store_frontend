import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { updateUnitSchema } from "@/feature/unit/schema/unit.schema"
import type { UnitResponse, UpdateUnitInput } from "@/feature/unit/schema/unit.schema"
import { UNIT_CATALOG } from "@/feature/unit/constant/unitCatalog"
import { getUnitByIdAPI, updateUnitAPI } from "@/feature/unit/api/unit.api"
import { EditUnitForm } from "@/feature/unit/component/editUnit.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

// Partial<UpdateUnitInput>: si esta Unidad se creó ANTES de este cambio (displayName libre,
// ya no existe en este catálogo fijo) no hay ninguna key que le corresponda -- se precarga
// vacío para que el admin elija una del catálogo actual en vez de forzar un match que no existe.
function toFormValues(unit: UnitResponse): Partial<UpdateUnitInput> {
    const matchingEntry = UNIT_CATALOG.find((entry) => entry.displayName === unit.displayName)
    return {
        unitKey: matchingEntry?.key,
    }
}

export function EditUnitPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const params = useParams()
    const unitId = Number(params.unitId)

    const unitQuery = useQuery({
        queryKey: ["unit", unitId],
        queryFn: () => getUnitByIdAPI(unitId),
        retry: false,
    })

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<UpdateUnitInput>({
        resolver: zodResolver(updateUnitSchema),
    })

    useEffect(() => {
        if (unitQuery.data) {
            reset(toFormValues(unitQuery.data.data))
        }
    }, [unitQuery.data, reset])

    const updateUnitMutation = useMutation({
        mutationFn: (formData: UpdateUnitInput) => updateUnitAPI(unitId, formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["units"] })
            toast.success(data.message)
            navigate("/admin/units")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        updateUnitMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("unit.edit.title")}</h1>
                <Link to="/admin/units" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                {unitQuery.isLoading && <p className="text-texto-suave">{t("common.loading")}</p>}
                {unitQuery.isError && <p className="text-error-fg">{t("common.loadError")}</p>}

                {unitQuery.data && (
                    <form onSubmit={onSubmit}>
                        <EditUnitForm register={register} errors={errors} watch={watch} />
                        <Button type="submit" disabled={updateUnitMutation.isPending}>
                            {updateUnitMutation.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                    </form>
                )}
            </Card>
        </PageContainer>
    )
}
