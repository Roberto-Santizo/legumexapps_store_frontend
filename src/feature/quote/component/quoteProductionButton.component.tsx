import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { useTranslation } from "react-i18next"
import { FileDown } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/shared/component/button.component"
import { QuoteProductionDocument } from "./quoteProductionDocument.component"
import type { ProductionReportProps } from "./quoteProductionDocument.component"

export function QuoteProductionButton(props: Readonly<ProductionReportProps>) {
    const { t } = useTranslation()
    const [pending, setPending] = useState(false)
    async function download() {
        setPending(true)
        try {
            const blob = await pdf(<QuoteProductionDocument {...props} />).toBlob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `Produccion_${props.orderId.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`
            document.body.appendChild(link); link.click(); link.remove()
            setTimeout(() => URL.revokeObjectURL(url), 1000)
        } catch { toast.error(t("quote.pdf.modal.error")) }
        finally { setPending(false) }
    }
    return <Button variant="secondary" disabled={pending || !props.lines.length} onClick={download}><FileDown size={16} />{t(pending ? "quote.production.generating" : "quote.production.download")}</Button>
}
