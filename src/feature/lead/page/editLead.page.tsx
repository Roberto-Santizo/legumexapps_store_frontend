import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { updateLeadSchema } from "@/feature/lead/schema/lead.schema"
import type { LeadResponse, UpdateLeadInput } from "@/feature/lead/schema/lead.schema"
import { getLeadByIdAPI, updateLeadAPI } from "@/feature/lead/api/adminLead.api"
import { LeadForm } from "@/feature/lead/component/leadForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { formatDateTime } from "@/shared/format/date"
import { formatCurrency } from "@/shared/format/currency"

function toFormValues(lead: LeadResponse): UpdateLeadInput {
    return {
        status: lead.status,
        notes: lead.notes,
    }
}

function ReadOnlyField({ label, value }: Readonly<{ label: string; value: string }>) {
    return (
        <div>
            <p className="text-xs font-medium tracking-wide text-texto-suave uppercase">{label}</p>
            <p className="text-verde-profundo">{value}</p>
        </div>
    )
}

export function EditLeadPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const params = useParams()
    const leadId = Number(params.leadId)

    const leadQuery = useQuery({
        queryKey: ["lead", leadId],
        queryFn: () => getLeadByIdAPI(leadId),
        retry: false,
    })

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateLeadInput>({
        resolver: zodResolver(updateLeadSchema),
    })

    useEffect(() => {
        if (leadQuery.data) {
            reset(toFormValues(leadQuery.data.data))
        }
    }, [leadQuery.data, reset])

    const updateLeadMutation = useMutation({
        mutationFn: (formData: UpdateLeadInput) => updateLeadAPI(leadId, formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["leads"] })
            toast.success(data.message)
            navigate("/admin/leads")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        updateLeadMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("lead.edit.title")}</h1>
                <Link to="/admin/leads" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                {leadQuery.isLoading && <p className="text-texto-suave">{t("common.loading")}</p>}
                {leadQuery.isError && <p className="text-error-fg">{t("common.loadError")}</p>}

                {leadQuery.data && (
                    <>
                        <div className="mb-6 grid grid-cols-1 gap-4 border-b border-gris-campo pb-6 sm:grid-cols-2">
                            <ReadOnlyField label={t("lead.form.fullName")} value={leadQuery.data.data.fullName} />
                            <ReadOnlyField label={t("lead.form.companyName")} value={leadQuery.data.data.companyName} />
                            <ReadOnlyField label={t("lead.form.phone")} value={leadQuery.data.data.phone ?? "—"} />
                            <ReadOnlyField label={t("lead.form.email")} value={leadQuery.data.data.email} />
                            <ReadOnlyField
                                label={t("lead.form.productLineInterest")}
                                value={leadQuery.data.data.productLineInterest ?? "—"}
                            />
                            <ReadOnlyField label={t("lead.table.receivedAt")} value={formatDateTime(leadQuery.data.data.createdAt)} />
                        </div>

                        <form onSubmit={onSubmit}>
                            <LeadForm register={register} errors={errors} />
                            <Button type="submit" disabled={updateLeadMutation.isPending}>
                                {updateLeadMutation.isPending ? t("common.saving") : t("common.save")}
                            </Button>
                        </form>
                    </>
                )}
            </Card>

            {/* Cotizaciones vinculadas a este prospecto (2026-09-13, ver Quote.leadId en el
            backend) -- solo lectura, resumen liviano (sin desglose de costos). Un Lead capturado
            desde el formulario público de la landing (antes de este cambio) nunca tendrá
            cotizaciones vinculadas -- quotes llega vacío, no falta la clave. */}
            {leadQuery.data && leadQuery.data.data.quotes && leadQuery.data.data.quotes.length > 0 && (
                <Card className="mt-6">
                    <h2 className="mb-4 text-lg font-semibold text-verde-profundo">{t("lead.edit.linkedQuotesTitle")}</h2>
                    <ul className="divide-y divide-gris-campo">
                        {leadQuery.data.data.quotes.map((quote) => (
                            <li key={quote.id} className="flex items-center justify-between gap-3 py-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-verde-profundo">
                                        {quote.productDisplayName}
                                        {quote.variantLabel && <span className="font-normal text-texto-suave"> · {quote.variantLabel}</span>}
                                    </p>
                                    <p className="text-xs text-texto-suave">
                                        {t("lead.edit.linkedQuoteSummary", {
                                            date: formatDateTime(quote.createdAt.toISOString()),
                                            pallets: quote.requestedPallets,
                                        })}
                                    </p>
                                </div>
                                <p className="shrink-0 font-semibold text-verde-profundo">{formatCurrency(quote.totalCost)}</p>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
        </PageContainer>
    )
}
