import { useState } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle, Plus, Trash2 } from "lucide-react"
import type { PalletKitMaterial } from "../schema/palletKit.schema"
import { Card } from "@/shared/component/card.component"
import { Select } from "@/shared/component/select.component"
import { Button } from "@/shared/component/button.component"
import { formatCurrency } from "@/shared/format/currency"

type Props = {
    type: PalletKitMaterial["materialType"]
    materials: PalletKitMaterial[]
    candidates: PalletKitMaterial[]
    canEdit: boolean
    busy: boolean
    onAdd: (packagingId: number) => void
    onRemove: (material: PalletKitMaterial) => void
}

// One kit type: its fixed quantity per pallet and its materials (several = the representative chooses one).
export function PalletKitTypeCard({ type, materials, candidates, canEdit, busy, onAdd, onRemove }: Readonly<Props>) {
    const { t } = useTranslation()
    const [selected, setSelected] = useState("")
    return <Card className={materials.length ? "" : "border-warning-border bg-warning-bg"}>
        <div className="mb-4">
            <h2 className="text-lg font-semibold text-ink-900">{t(`packaging.consumption.types.${type}`)}</h2>
            <p className="text-sm text-ink-600">{t(`palletKit.quantity.${type}`)}</p>
        </div>
        {!materials.length && <p className="mb-4 flex items-center gap-2 text-sm font-medium text-warning-fg"><AlertTriangle size={16} aria-hidden="true" />{t("palletKit.empty")}</p>}
        <ul className="mb-4 space-y-2">
            {materials.map(material => <li key={material.id} className="flex items-center justify-between gap-3 rounded-xl bg-canvas p-3 text-sm">
                <span className="min-w-0">
                    <span className="block break-words font-medium text-ink-900">{material.displayName}</span>
                    <span className="block text-ink-600">{material.code} · {formatCurrency(material.unitCost)}</span>
                </span>
                {canEdit && <button type="button" disabled={busy} aria-label={t("palletKit.remove", { name: material.displayName })} onClick={() => onRemove(material)}
                    className="flex size-11 shrink-0 items-center justify-center rounded-control text-danger transition-colors hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-40"><Trash2 size={18} aria-hidden="true" /></button>}
            </li>)}
        </ul>
        {materials.length > 1 && <p className="mb-4 text-xs font-medium text-focus">{t("palletKit.chosen")}</p>}
        {canEdit && <div className="flex flex-col gap-2">
            <label htmlFor={`kit-add-${type}`} className="sr-only">{t("palletKit.add")}</label>
            <Select id={`kit-add-${type}`} value={selected} disabled={busy || !candidates.length} onChange={event => setSelected(event.target.value)}>
                <option value="">{t(candidates.length ? "palletKit.choose" : "palletKit.noCandidates")}</option>
                {candidates.map(material => <option key={material.id} value={material.id}>{material.displayName} · {material.code}</option>)}
            </Select>
            <Button variant="secondary" className="shrink-0" disabled={busy || !selected} onClick={() => { onAdd(Number(selected)); setSelected("") }}><Plus size={16} aria-hidden="true" />{t("palletKit.add")}</Button>
        </div>}
    </Card>
}
