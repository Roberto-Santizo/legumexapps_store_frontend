import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { DefaultValues } from "react-hook-form"
import { toast } from "sonner"
import { createTransformationAPI } from "@/feature/rawMaterialTransformation/api/rawMaterialTransformation.api"
import { TRANSFORMATION_COST_CATEGORIES } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"
import type { TransformationFormValues } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"
import { DEFAULT_COST_CONCEPTS } from "@/feature/rawMaterialTransformation/constant/rawMaterialTransformation.constant"
import { TransformationForm } from "@/feature/rawMaterialTransformation/component/transformationForm.component"
import { TransformationPageHeader } from "@/feature/rawMaterialTransformation/component/transformationPageHeader.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { showErrorToast } from "@/shared/i18n/showErrorToast"

export function CreateRawMaterialTransformationPage() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    // Solo al montar: cambiar el idioma después no debe reiniciar lo que el admin ya escribió.
    const [defaultValues] = useState<DefaultValues<TransformationFormValues>>(() => ({
        unprocessedCode: "",
        unprocessedName: "",
        processedCode: "",
        processedName: "",
        processedNameEn: "",
        ingredientType: "" as TransformationFormValues["ingredientType"],
        inputCurrency: "GTQ",
        freightPerPound: 0,
        freightCurrency: "GTQ",
        costs: TRANSFORMATION_COST_CATEGORIES.flatMap((category) => DEFAULT_COST_CONCEPTS[category].map((concept) => ({
            category,
            conceptName: t(`rawMaterialTransformation.defaults.${concept}`).toLocaleUpperCase(i18n.language),
            amount: 0,
            currency: "USD" as const,
            costBasis: "per_processed_pound" as const,
            poundsPerUnit: null,
        }))),
    }))

    const mutation = useMutation({
        mutationFn: createTransformationAPI,
        onSuccess: (response) => {
            if (!response) return
            queryClient.invalidateQueries({ queryKey: ["rawMaterialTransformations"] })
            queryClient.invalidateQueries({ queryKey: ["rawMaterials"] })
            toast.success(response.message)
            navigate(`/admin/raw-material-transformations/${response.data.id}`)
        },
        onError: (error) => showErrorToast(error),
    })

    return (
        <PageContainer wide>
            <TransformationPageHeader
                title={t("rawMaterialTransformation.title")}
                description={t("rawMaterialTransformation.description")}
                actions={<Link to="/admin/raw-material-transformations" className={buttonClassName("secondary")}>{t("common.back")}</Link>}
            />
            <TransformationForm
                defaultValues={defaultValues}
                submitLabel={t("rawMaterialTransformation.form.submitCreate")}
                isSubmitting={mutation.isPending}
                onSubmit={(values) => mutation.mutate(values)}
            />
        </PageContainer>
    )
}
