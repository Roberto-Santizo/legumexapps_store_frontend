import { showErrorToast } from "@/shared/i18n/showErrorToast"
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
import { QuotePdfButton } from "@/feature/quote/component/quotePdfButton.component"
import { sendAdminQuotePdfEmailAPI } from "@/feature/quote/api/adminQuote.api"
import { toCustomQuoteDocumentLine } from "@/feature/customQuote/component/customQuoteComposition"
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
            <p className="text-xs font-medium tracking-wide text-ink-600 uppercase">{label}</p>
            <div className="text-ink-900">{children}</div>
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
        onError: (error) => showErrorToast(error),
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

export function AdminCustomQuoteDetailPage() {
    const { t, i18n } = useTranslation()
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
                    <p className="text-sm text-ink-600">{t("adminCustomQuote.detail.title", { id: customQuoteId })}</p>
                    <h1 className="text-2xl font-semibold text-ink-900">{customQuote?.productDisplayName ?? "…"}</h1>
                    {customQuote?.variantLabel && <p className="text-ink-600">{customQuote.variantLabel}</p>}
                </div>
                <Link to="/admin/quotes?type=customizable" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            {customQuoteQuery.isLoading && <Spinner />}
            {customQuoteQuery.isError && <p className="text-danger">{t("common.loadError")}</p>}

            {customQuote && (
                <div className="space-y-6">
                    <QuotePdfButton lines={[toCustomQuoteDocumentLine(customQuote)]} quoteDate={new Date(customQuote.createdAt)} showCostBreakdown={false} showReferenceDisclaimer sendEmailAPI={hasPermission("quotes:calculate") ? sendAdminQuotePdfEmailAPI : undefined} />
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
                                    <p className="text-sm text-ink-600">{customQuote.salesperson.email}</p>
                                </>
                            ) : (
                                "—"
                            )}
                        </ReadOnlyField>
                        <ReadOnlyField label={t("adminCustomQuote.detail.createdAt")}>{formatDateTime(customQuote.createdAt, i18n.language)}</ReadOnlyField>
                        <ReadOnlyField label={t("adminCustomQuote.detail.subCategory")}>
                            {customQuote.subCategoryName ?? "—"}
                            {customQuote.destinationName && (
                                <p className="text-sm text-ink-600">
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
