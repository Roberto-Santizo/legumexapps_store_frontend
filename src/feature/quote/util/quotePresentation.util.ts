import type { TFunction } from "i18next"

// Subtítulo de la tarjeta de presentación: unidades por caja + cajas por palet.
export function presentationDetails(presentation: { bagsPerBox: number; boxesPerPallet: number }, t: TFunction): string {
    return [
        t("site.quoteRequest.form.variantLabel.unitsPerBox", { count: presentation.bagsPerBox }),
        t("site.quoteRequest.form.variantLabel.boxesPerPallet", { count: presentation.boxesPerPallet }),
    ].join(" · ")
}
