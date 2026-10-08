import type { JuiceResource } from "../constant/juiceFields"
import type { JuiceRow } from "../schema/juice.schema"

export type ReferenceOption = { value: number; label: string }

// Every listed column holds a primitive in the response schemas; anything else has no meaningful text form.
export function formatJuiceCellValue(value: unknown): string {
    if (value === null || value === undefined) return "—"
    if (typeof value === "string") return value
    if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value)
    return "—"
}

// Catalog rows are named by displayName, presentations by displayLabel; other rows (overrides) use the section title.
export function juiceRowLabel(item: JuiceRow, fallback: string): string {
    if (typeof item.displayName === "string") return item.displayName
    if (typeof item.displayLabel === "string") return item.displayLabel
    return fallback
}

// Active catalog items not yet linked to this juice.
export function buildReferenceOptions(references: JuiceRow[], rows: JuiceRow[], referenceName: string | undefined): ReferenceOption[] {
    if (!referenceName) return []
    return references
        .filter(reference => reference.isActive && !rows.some(row => row[referenceName] === reference.id))
        .map(reference => ({ value: reference.id, label: `${formatJuiceCellValue(reference.code)} — ${formatJuiceCellValue(reference.displayName)}` }))
}

// The recipe form previews the total without the edited row's own (active) share.
export function recipeMixBaseUnits(resource: JuiceResource, totalUnits: number, row: JuiceRow | undefined): number | undefined {
    if (resource.title !== "recipe") return undefined
    const ownUnits = row?.isActive ? Math.round(Number(row.percentage) * 1000000) : 0
    return totalUnits - ownUnits
}

export function juiceEditorTitleKey(viewing: boolean, row: JuiceRow | undefined): string {
    if (viewing) return "juice.viewDetails"
    return row ? "common.edit" : "juice.add"
}

// Overrides are addressed by client id; every other resource by its own row id.
export function juiceRowPath(resource: JuiceResource, row: JuiceRow | undefined, isOverride: boolean): string {
    if (!row) return resource.path
    return `${resource.path}/${isOverride ? Number(row.clientId) : row.id}`
}
