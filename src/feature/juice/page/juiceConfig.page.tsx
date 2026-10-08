import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { JuiceForm } from "../component/juiceForm.component"
import { JuiceSection } from "../component/juiceSection.component"
import { constantFields, overridesResource } from "../constant/juiceFields"
import { constantsInputSchema, constantsResponseSchema } from "../schema/juice.schema"
import { getJuiceConstants } from "../api/juice.api"

const constantSections = [
    { titleKey: "juice.constantSections.production", fields: constantFields.filter(field => field.name.endsWith("PerPound")) },
    { titleKey: "juice.constantSections.logistics", fields: constantFields.filter(field => field.name.endsWith("PerContainer") && field.name !== "palletsPerContainer") },
    { titleKey: "juice.constantSections.percentages", fields: constantFields.filter(field => field.name.endsWith("Rate")), fractionHelp: true },
    { titleKey: "juice.constantSections.container", fields: constantFields.filter(field => field.name === "palletsPerContainer") },
]

export function JuiceConfigPage() {
    const { t } = useTranslation()
    const query = useQuery({ queryKey: ["juice", "constants"], queryFn: getJuiceConstants, retry: false })
    function renderGlobals() {
        if (query.isLoading) return <p>{t("common.loading")}</p>
        if (query.isError) return <p role="alert" className="text-danger">{query.error.message}</p>
        return <>
            {!query.data && <p className="mb-4 text-sm text-ink-600">{t("juice.initialize")}</p>}
            <JuiceForm key={query.data?.revision ?? "create"} fields={constantFields} fieldSections={constantSections} schema={constantsInputSchema} responseSchema={constantsResponseSchema} path="/admin/juice-config/constants" row={query.data ?? undefined} />
        </>
    }
    return <PageContainer>
        <div className="mb-6 flex items-center justify-between gap-3"><h1 className="text-2xl font-semibold text-ink-900">{t("juice.configTitle")}</h1><Link to="/admin/juices" className={buttonClassName("secondary")}>{t("common.back")}</Link></div>
        <div className="space-y-6"><Card>
            <h2 className="mb-4 text-lg font-semibold text-ink-900">{t("juice.globals")}</h2>
            <p className="mb-4 text-sm text-ink-600">{t("juice.constantsHelp")} {t("juice.rateHelp")}</p>
            {renderGlobals()}
        </Card><JuiceSection resource={overridesResource} /></div>
    </PageContainer>
}
