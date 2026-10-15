import { useEffect, useMemo, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { Control } from "react-hook-form"
import { useWatch } from "react-hook-form"
import { previewTransformationAPI } from "@/feature/rawMaterialTransformation/api/rawMaterialTransformation.api"
import { toPreviewPayload } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"
import type { TransformationFormValues } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"

const PREVIEW_DEBOUNCE_MS = 400

// Vista previa calculada por el servidor (única fuente de la fórmula). Se consulta solo cuando los
// datos de cálculo son válidos; la clave es un string para no disparar consultas por identidad.
export function useTransformationPreview(control: Control<TransformationFormValues>) {
    const values = useWatch({ control })
    const payloadKey = useMemo(() => {
        const payload = toPreviewPayload(values)
        return payload ? JSON.stringify(payload) : null
    }, [values])
    const [debouncedKey, setDebouncedKey] = useState(payloadKey)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedKey(payloadKey), PREVIEW_DEBOUNCE_MS)
        return () => clearTimeout(timer)
    }, [payloadKey])

    const query = useQuery({
        queryKey: ["rawMaterialTransformationPreview", debouncedKey],
        queryFn: () => previewTransformationAPI(JSON.parse(debouncedKey!)),
        enabled: debouncedKey !== null,
        placeholderData: keepPreviousData,
        retry: false,
    })

    const isComplete = payloadKey !== null
    return {
        result: isComplete && !query.isError ? query.data?.data : undefined,
        isComplete,
        isCalculating: isComplete && (payloadKey !== debouncedKey || query.isFetching),
        error: isComplete ? query.error : null,
    }
}
