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

export function JuiceConfigPage() {
    const { t } = useTranslation()
    const query = useQuery({ queryKey: ["juice", "constants"], queryFn: getJuiceConstants, retry: false })
    return <PageContainer>
        <div className="mb-6 flex items-center justify-between gap-3"><h1 className="text-2xl font-semibold text-verde-profundo">{t("juice.configTitle")}</h1><Link to="/admin/juices" className={buttonClassName("secondary")}>{t("common.back")}</Link></div>
        <div className="space-y-6"><Card>
            <h2 className="mb-4 text-lg font-semibold text-verde-profundo">{t("juice.globals")}</h2>
            <p className="mb-4 text-sm text-texto-suave">{t("juice.constantsHelp")} {t("juice.rateHelp")}</p>
            {query.isLoading ? <p>{t("common.loading")}</p> : query.isError ? <p role="alert" className="text-error-fg">{query.error.message}</p> : <>
                {!query.data && <p className="mb-4 text-sm text-texto-suave">{t("juice.initialize")}</p>}
                <JuiceForm key={query.data?.revision ?? "create"} fields={constantFields} schema={constantsInputSchema} responseSchema={constantsResponseSchema} path="/admin/juice-config/constants" row={query.data ?? undefined} />
            </>}
        </Card><JuiceSection resource={overridesResource} /></div>
    </PageContainer>
}
