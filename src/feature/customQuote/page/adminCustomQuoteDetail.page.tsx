import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getAdminCustomQuoteByIdAPI, updateAdminCustomQuoteStatusAPI } from "@/feature/customQuote/api/adminCustomQuote.api"
import { CUSTOM_QUOTE_STATUSES } from "@/feature/customQuote/schema/adminCustomQuote.schema"
import type { AdminCustomQuoteDetail, CustomQuoteStatus } from "@/feature/customQuote/schema/adminCustomQuote.schema"
import { CustomQuoteStatusBadge } from "@/feature/customQuote/component/customQuoteStatusBadge.component"
import { CustomQuoteSpecification } from "@/feature/customQuote/component/customQuoteSpecification.component"
import { QuoteResultCard } from "@/feature/quote/component/quoteResultCard.component"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { Select } from "@/shared/component/select.component"
import { Spinner } from "@/shared/component/spinner.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { formatDateTime } from "@/shared/format/date"

function ReadOnlyField({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
    return (
        <div>
            <p className="text-xs font-medium tracking-wide text-texto-suave uppercase">{label}</p>
            <div className="text-verde-profundo">{children}</div>
        </div>
    )
}

// Cambiar el estado del seguimiento (customQuotes:edit). Solo el estado: el desglose y la
// configuración guardados nunca se editan.
function StatusControl({ customQuote }: Readonly<{ customQuote: AdminCustomQuoteDetail }>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [status, setStatus] = useState<CustomQuoteStatus>(customQuote.status)

    useEffect(() => {
        setStatus(customQuote.status)
    }, [customQuote.status])

    const statusMutation = useMutation({
        mutationFn: (nextStatus: CustomQuoteStatus) => updateAdminCustomQuoteStatusAPI(customQuote.id, nextStatus),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ["adminCustomQuote", customQuote.id] })
            queryClient.invalidateQueries({ queryKey: ["adminCustomQuotes"] })
            if (response) toast.success(response.message)
        },
        onError: (error) => toast.error(error.message),
    })

    return (
        <div className="flex flex-wrap items-center gap-3">
            <Select
                id="customQuoteStatus"
                aria-label={t("adminCustomQuote.detail.status")}
                value={status}
                onChange={(event) => setStatus(event.target.value as CustomQuoteStatus)}
                className="w-auto min-w-48"
            >
                {CUSTOM_QUOTE_STATUSES.map((option) => (
                    <option key={option} value={option}>
                        {t(`adminCustomQuote.status.${option}`)}
                    </option>
                ))}
            </Select>
            <Button
                type="button"
                disabled={status === customQuote.status || statusMutation.isPending}
                onClick={() => statusMutation.mutate(status)}
            >
                {statusMutation.isPending ? t("common.saving") : t("adminCustomQuote.detail.saveStatus")}
            </Button>
        </div>
    )
}

// Detalle de una cotización a la medida: quién la pidió y cuándo, su estado de seguimiento, la ficha de
// fabricación (CustomQuoteSpecification) y el desglose completo de costos (el mismo QuoteResultCard del
// cotizador interno, con showCostBreakdown).
export function AdminCustomQuoteDetailPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const params = useParams()
    const customQuoteId = Number(params.customQuoteId)

    const customQuoteQuery = useQuery({
        queryKey: ["adminCustomQuote", customQuoteId],
        queryFn: () => getAdminCustomQuoteByIdAPI(customQuoteId),
        retry: false,
    })
    const customQuote = customQuoteQuery.data?.data

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm text-texto-suave">{t("adminCustomQuote.detail.title", { id: customQuoteId })}</p>
                    <h1 className="text-2xl font-semibold text-verde-profundo">{customQuote?.productDisplayName ?? "…"}</h1>
                    {customQuote?.variantLabel && <p className="text-texto-suave">{customQuote.variantLabel}</p>}
                </div>
                <Link to="/admin/custom-quotes" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            {customQuoteQuery.isLoading && <Spinner />}
            {customQuoteQuery.isError && <p className="text-error-fg">{t("common.loadError")}</p>}

            {customQuote && (
                <div className="space-y-6">
                    <Card className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <ReadOnlyField label={t("adminCustomQuote.detail.status")}>
                            {hasPermission("customQuotes:edit") ? (
                                <StatusControl customQuote={customQuote} />
                            ) : (
                                <CustomQuoteStatusBadge status={customQuote.status} />
                            )}
                        </ReadOnlyField>
                        <ReadOnlyField label={t("adminCustomQuote.detail.salesperson")}>
                            {customQuote.salesperson ? (
                                <>
                                    <p className="font-medium">
                                        {customQuote.salesperson.name}
                                        {customQuote.salesperson.companyName ? ` · ${customQuote.salesperson.companyName}` : ""}
                                    </p>
                                    <p className="text-sm text-texto-suave">{customQuote.salesperson.email}</p>
                                </>
                            ) : (
                                "—"
                            )}
                        </ReadOnlyField>
                        <ReadOnlyField label={t("adminCustomQuote.detail.createdAt")}>{formatDateTime(customQuote.createdAt)}</ReadOnlyField>
                        <ReadOnlyField label={t("adminCustomQuote.detail.subCategory")}>
                            {customQuote.subCategoryName ?? "—"}
                            {customQuote.destinationName && (
                                <p className="text-sm text-texto-suave">
                                    {t("adminCustomQuote.detail.destination")}: {customQuote.destinationName}
                                </p>
                            )}
                        </ReadOnlyField>
                    </Card>

                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                        <CustomQuoteSpecification customQuote={customQuote} />
                        <QuoteResultCard
                            result={customQuote}
                            isPending={false}
                            showCostBreakdown
                            showTransport={customQuote.destinationId !== null}
                        />
                    </div>
                </div>
            )}
        </PageContainer>
    )
}
