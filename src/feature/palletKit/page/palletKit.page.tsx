import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { addPalletKitMaterialAPI, getPalletKitAPI, getPalletKitCandidatesAPI, removePalletKitMaterialAPI } from "../api/palletKit.api"
import { PalletKitTypeCard } from "../component/palletKitTypeCard.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Spinner } from "@/shared/component/spinner.component"
import { usePermission } from "@/shared/auth/usePermission"
import { showErrorToast } from "@/shared/i18n/showErrorToast"

// The standard pallet kit, added to every quote per pallet. Materials are created in Packaging; here they are assigned.
export function PalletKitPage() {
    const { t } = useTranslation()
    const client = useQueryClient()
    const { hasPermission } = usePermission()
    const canEdit = hasPermission("palletKit:edit")
    const kit = useQuery({ queryKey: ["palletKit"], queryFn: getPalletKitAPI })
    const candidates = useQuery({ queryKey: ["palletKitCandidates"], queryFn: getPalletKitCandidatesAPI, enabled: canEdit })
    const [busy, setBusy] = useState(false)
    async function run(work: () => Promise<{ message: string } | undefined>) {
        setBusy(true)
        try {
            const response = await work()
            if (response) toast.success(response.message)
            await Promise.all(["palletKit", "palletKitCandidates", "catalogQuoteDiscovery", "adminCatalogQuoteDiscovery"].map(key => client.invalidateQueries({ queryKey: [key] })))
        } catch (error) { showErrorToast(error as Error) } finally { setBusy(false) }
    }
    if (kit.isLoading) return <PageContainer><Spinner /></PageContainer>
    if (kit.isError || !kit.data) return <PageContainer><p role="alert" className="text-danger">{t("common.loadError")}</p></PageContainer>
    return <PageContainer wide>
        <div className="mb-6">
            <h1 className="text-2xl font-semibold text-ink-900">{t("palletKit.title")}</h1>
            <p className="mt-1 max-w-3xl text-ink-600">{t("palletKit.hint")}</p>
            {hasPermission("packagings:create") && <Link to="/admin/packagings/create" className="mt-2 inline-block text-sm font-semibold text-focus underline">{t("palletKit.createMaterial")}</Link>}
        </div>
        <p role="status" className={`mb-6 rounded-panel border p-4 text-sm font-medium ${kit.data.complete ? "border-success-border bg-success-bg text-success" : "border-warning-border bg-warning-bg text-warning-fg"}`}>
            {t(kit.data.complete ? "palletKit.complete" : "palletKit.incomplete")}
        </p>
        <div className="grid gap-5 lg:grid-cols-3">
            {kit.data.types.map(({ type, materials }) => <PalletKitTypeCard key={type} type={type} materials={materials} canEdit={canEdit} busy={busy}
                candidates={(candidates.data ?? []).filter(material => material.materialType === type)}
                onAdd={packagingId => void run(() => addPalletKitMaterialAPI(packagingId))}
                onRemove={material => void run(() => removePalletKitMaterialAPI(material.id))} />)}
        </div>
    </PageContainer>
}
