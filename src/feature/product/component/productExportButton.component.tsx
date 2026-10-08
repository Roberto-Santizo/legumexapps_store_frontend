import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Button } from "@/shared/component/button.component"
import { downloadBlob } from "@/shared/utils/downloadBlob"
import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { exportProductCatalogAPI } from "../api/productExport.api"

export function ProductExportButton() {
    const { t } = useTranslation()
    const exportMutation = useMutation({
        mutationFn: exportProductCatalogAPI,
        onSuccess: blob => downloadBlob(blob, `catalogo-productos-${new Date().toISOString().slice(0, 10)}.xlsx`),
        onError: error => showErrorToast(error),
    })
    return <Button variant="secondary" disabled={exportMutation.isPending} aria-busy={exportMutation.isPending}
        onClick={() => exportMutation.mutate()}>
        {t(exportMutation.isPending ? "product.export.pending" : "product.export.button")}
    </Button>
}
