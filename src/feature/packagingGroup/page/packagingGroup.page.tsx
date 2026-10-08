import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { getPackagingGroupsAPI, savePackagingGroupAPI, setPackagingGroupStatusAPI } from "../api/packagingGroup.api"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"
import { StatusToggleButton } from "@/shared/component/statusToggleButton.component"
import { Table, TableHead, TableRow, Th, TableBody, Td, TableContainer, TableEmpty } from "@/shared/component/table.component"

export function PackagingGroupPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const client = useQueryClient()
    const [editingId, setEditingId] = useState<number | undefined>()
    const [displayName, setDisplayName] = useState("")
    const query = useQuery({ queryKey: ["packagingGroups"], queryFn: getPackagingGroupsAPI, retry: false })
    const refresh = () => Promise.all(["packagingGroups", "packagingGroupOptions", "productVariantUnitMaterials", "quoteProducts", "adminQuoteProducts"].map(key => client.invalidateQueries({ queryKey: [key] })))
    const save = useMutation({ mutationFn: savePackagingGroupAPI, onSuccess: async data => {
        if (!data) return
        await refresh(); setEditingId(undefined); setDisplayName(""); toast.success(data.message)
    }, onError: (error: Error) => showErrorToast(error) })
    const status = useMutation({ mutationFn: setPackagingGroupStatusAPI, onSuccess: async data => {
        if (!data) return
        await refresh(); toast.success(data.message)
    }, onError: (error: Error) => showErrorToast(error) })
    return <PageContainer>
        <h1 className="mb-6 text-2xl font-semibold text-ink-900">{t("packagingGroup.title")}</h1>
        <p className="mb-4 text-sm text-ink-600">{t("packagingGroup.hint")}</p>
        {(editingId ? hasPermission("packagingGroups:edit") : hasPermission("packagingGroups:create")) && <Card>
            <form onSubmit={event => { event.preventDefault(); if (displayName.trim()) save.mutate({ id: editingId, displayName: displayName.trim() }) }}>
                <FormField required label={t("packagingGroup.name")} htmlFor="packagingGroupName">
                    <Input id="packagingGroupName" required maxLength={60} value={displayName} onChange={event => setDisplayName(event.target.value)} />
                </FormField>
                <div className="flex gap-3">
                    <Button type="submit" disabled={save.isPending || !displayName.trim()}>{editingId ? t("common.save") : t("packagingGroup.add")}</Button>
                    {editingId && <Button variant="secondary" onClick={() => { setEditingId(undefined); setDisplayName("") }}>{t("common.cancel")}</Button>}
                </div>
            </form>
        </Card>}
        {query.isLoading && <p>{t("common.loading")}</p>}
        {query.isError && <p className="text-danger">{t("common.loadError")}</p>}
        {query.data && <TableContainer className="mt-6"><Table>
            <TableHead><TableRow><Th>{t("packagingGroup.name")}</Th><Th>{t("common.status")}</Th><Th>{t("common.actions")}</Th></TableRow></TableHead>
            <TableBody>{query.data.data.map(group => <TableRow key={group.id}>
                <Td>{group.displayName}</Td><Td><StatusBadge isActive={group.isActive} /></Td>
                <Td>{hasPermission("packagingGroups:edit") && <div className="flex items-center gap-3">
                    <Button variant="secondary" onClick={() => { setEditingId(group.id); setDisplayName(group.displayName) }}>{t("common.edit")}</Button>
                    <StatusToggleButton isActive={group.isActive} isPending={status.isPending} onToggle={() => status.mutate({ id: group.id, isActive: !group.isActive })} />
                </div>}</Td>
            </TableRow>)}{query.data.data.length === 0 && <TableEmpty colSpan={3} message={t("packagingGroup.empty")} />}</TableBody>
        </Table></TableContainer>}
    </PageContainer>
}
