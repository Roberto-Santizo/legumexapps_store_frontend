import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { JuiceCategorySelect } from "./juiceCategorySelect.component"
import { usePermission } from "@/shared/auth/usePermission"
import { Button } from "@/shared/component/button.component"
import { saveJuiceRow } from "../api/juice.api"

export function JuiceProductLink({ juiceId, productId }: Readonly<{ juiceId: number; productId?: number | null }>) {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const cache = useQueryClient()
    const [subCategoryId, setSubCategoryId] = useState<number>()
    const mutation = useMutation({
        mutationFn: () => saveJuiceRow(`/admin/juices/${juiceId}/product`, z.object({ productId: z.number(), juiceId: z.number() }), { subCategoryId }),
        onSuccess: () => { cache.invalidateQueries({ queryKey: ["juice"] }); cache.invalidateQueries({ queryKey: ["products"] }) },
    })
    if (productId) return <div className="space-y-2">
        <p>{t("juice.sharedCatalogHelp")}</p>
    </div>
    if (!hasPermission("juices:edit") || !hasPermission("products:create")) return <p>{t("juice.linkPermissionHelp")}</p>
    return <div className="space-y-3">
        <p>{t("juice.linkHelp")}</p>
        <JuiceCategorySelect inputId={`juice-subcategory-${juiceId}`} value={subCategoryId} onChange={setSubCategoryId} disabled={mutation.isPending} />
        <Button type="button" disabled={!subCategoryId || mutation.isPending} onClick={() => mutation.mutate()}>{t("juice.linkProduct")}</Button>
        {mutation.isError && <p role="alert" className="text-danger">{mutation.error.message}</p>}
    </div>
}
