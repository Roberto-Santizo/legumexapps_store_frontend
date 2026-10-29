import type { CalculateQuoteInput, QuotableProduct } from "@/feature/quote/schema/quote.schema"
import type { MaterialGroup } from "@/feature/quote/component/quoteMaterialGroups.component"

type PalletKit = QuotableProduct["variants"][number]["palletKit"]
type KitType = PalletKit[number]["type"]
const KIT_KEY = "pallet:kit:"

// Kit types with several materials (e.g. wooden or cardboard corner boards) are a required choice;
// a type with one material is simply included. The quantity is never chosen.
export function palletKitGroups(palletKit: PalletKit, selection: Record<string, number>): MaterialGroup[] {
    return palletKit.filter((part) => part.options.length > 1).map((part) => {
        const key = `${KIT_KEY}${part.type}`
        const options = part.options
        return { key, level: "pallet" as const, group: part.group, options, selectedId: options.find((option) => option.id === selection[key])?.id }
    })
}

export function palletKitIncluded(palletKit: PalletKit) {
    return palletKit.filter((part) => part.options.length === 1).flatMap((part) => part.options)
}

// The chosen kit materials, sent apart from the SKU's own material rows.
export function palletKitSelections(kitGroups: MaterialGroup[]): Pick<CalculateQuoteInput, "palletKitSelections"> {
    const selections = kitGroups.filter((group) => group.selectedId !== undefined)
        .map((group) => ({ type: group.key.slice(KIT_KEY.length) as KitType, packagingId: group.selectedId as number }))
    return selections.length ? { palletKitSelections: selections } : {}
}
