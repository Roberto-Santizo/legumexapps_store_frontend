import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { PalletKit } from "../schema/palletKit.schema"
import { Button } from "@/shared/component/button.component"
import { Card } from "@/shared/component/card.component"
import { Select } from "@/shared/component/select.component"

type Rules = { defaultPackagingId: number; overrides: { clientId: number; packagingId: number }[] }
type Props = { kit: PalletKit; clients: { id: number; name: string }[]; busy: boolean; onSave: (rules: Rules) => void }

export function PalletKitRules({ kit, clients, busy, onSave }: Readonly<Props>) {
    const { t } = useTranslation()
    const [defaultId, setDefaultId] = useState(kit.palletRules?.defaultPackagingId?.toString() ?? "")
    const [overrides, setOverrides] = useState(kit.palletRules?.overrides ?? [])
    const [clientId, setClientId] = useState("")
    const [packagingId, setPackagingId] = useState("")
    const pallets = kit.types.find(part => part.type === "TARIMA")?.materials ?? []
    const valid = !!defaultId && overrides.every(row => pallets.some(p => p.id === row.packagingId) && row.packagingId !== Number(defaultId))
    const options = <><option value="">{t("palletKit.choose")}</option>{pallets.map(p => <option key={p.id} value={p.id}>{p.displayName} · {p.code}</option>)}</>
    return <Card className="mt-6">
        <h2 className="text-lg font-semibold text-ink-900">{t("palletKit.rules.title")}</h2>
        <p className="my-2 text-sm text-ink-600">{t("palletKit.rules.hint")}</p>
        <label htmlFor="kit-default-pallet" className="block text-sm font-medium">{t("palletKit.rules.default")}</label>
        <Select id="kit-default-pallet" value={defaultId} disabled={busy} onChange={e => setDefaultId(e.target.value)}>{options}</Select>
        <ul className="my-4 space-y-2">
            {overrides.map(row => <li key={row.clientId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{clients.find(c => c.id === row.clientId)?.name ?? `#${row.clientId}`} → {pallets.find(p => p.id === row.packagingId)?.displayName ?? `#${row.packagingId}`}</span>
                <Button variant="secondary" disabled={busy} onClick={() => setOverrides(rows => rows.filter(r => r.clientId !== row.clientId))}>{t("palletKit.rules.remove")}</Button>
            </li>)}
        </ul>
        <div className="grid gap-3 sm:grid-cols-2">
            <div><label htmlFor="kit-rule-client" className="block text-sm font-medium">{t("palletKit.rules.client")}</label>
                <Select id="kit-rule-client" value={clientId} disabled={busy} onChange={e => setClientId(e.target.value)}><option value="">{t("palletKit.choose")}</option>{clients.filter(c => !overrides.some(r => r.clientId === c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <div><label htmlFor="kit-rule-pallet" className="block text-sm font-medium">{t("palletKit.rules.pallet")}</label>
                <Select id="kit-rule-pallet" value={packagingId} disabled={busy} onChange={e => setPackagingId(e.target.value)}>{options}</Select></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" disabled={busy || !clientId || !packagingId || packagingId === defaultId} onClick={() => { setOverrides(rows => [...rows, { clientId: Number(clientId), packagingId: Number(packagingId) }]); setClientId(""); setPackagingId("") }}>{t("palletKit.rules.add")}</Button>
            <Button disabled={busy || !valid} onClick={() => onSave({ defaultPackagingId: Number(defaultId), overrides })}>{t("palletKit.rules.save")}</Button>
        </div>
    </Card>
}
