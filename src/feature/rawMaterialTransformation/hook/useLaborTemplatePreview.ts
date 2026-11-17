import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { DeepPartial } from "react-hook-form"
import { previewLaborTemplateAPI } from "@/feature/rawMaterialTransformation/api/laborTemplate.api"
import { laborPreviewPayload } from "@/feature/rawMaterialTransformation/util/laborTemplateForm"
import type { LaborTemplateValues } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"

export function useLaborTemplatePreview(values: DeepPartial<LaborTemplateValues>, calendarYear: number | null = null) {
    const payload = laborPreviewPayload(values)
    const key = payload ? JSON.stringify(payload) : null
    const [debounced, setDebounced] = useState(key)
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(key), 400)
        return () => clearTimeout(timer)
    }, [key])
    const query = useQuery({ queryKey: ["laborTemplatePreview", debounced, calendarYear], queryFn: () => previewLaborTemplateAPI(JSON.parse(debounced!)), enabled: debounced !== null, retry: false })
    return { result: key !== null && key === debounced && !query.isError ? query.data : undefined,
        isCalculating: key !== null && (key !== debounced || query.isFetching), isComplete: key !== null, hasError: query.isError }
}
