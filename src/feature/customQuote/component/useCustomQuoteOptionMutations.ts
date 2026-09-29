import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type MutationResult = { message: string } | undefined

type OptionMutationsConfig<CreateInput, UpdateInput> = {
    queryKey: string
    create: (input: CreateInput) => Promise<MutationResult>
    update: (id: number, input: UpdateInput) => Promise<MutationResult>
    setStatus: (id: number, isActive: boolean) => Promise<MutationResult>
    // Se llama tras crear o editar con éxito (limpiar el formulario / salir de edición).
    onSaved: () => void
}

// Las cuatro secciones de la configuración a la medida guardan igual: crear, editar y activar/
// desactivar, invalidando su propia lista y mostrando el mensaje traducido que devuelve el backend
// (los 409/422 de reglas de negocio llegan como error.message ya traducido).
export function useCustomQuoteOptionMutations<CreateInput, UpdateInput>({
    queryKey,
    create,
    update,
    setStatus,
    onSaved,
}: OptionMutationsConfig<CreateInput, UpdateInput>) {
    const queryClient = useQueryClient()
    const invalidate = () => queryClient.invalidateQueries({ queryKey: [queryKey] })

    function handleSuccess(data: MutationResult) {
        invalidate()
        if (data) toast.success(data.message)
    }

    const createMutation = useMutation({
        mutationFn: create,
        onSuccess: (data) => {
            handleSuccess(data)
            onSaved()
        },
        onError: (error) => toast.error(error.message),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, input }: { id: number; input: UpdateInput }) => update(id, input),
        onSuccess: (data) => {
            handleSuccess(data)
            onSaved()
        },
        onError: (error) => toast.error(error.message),
    })

    const statusMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setStatus(id, isActive),
        onSuccess: handleSuccess,
        onError: (error) => toast.error(error.message),
    })

    return {
        createMutation,
        updateMutation,
        statusMutation,
        isSaving: createMutation.isPending || updateMutation.isPending,
    }
}
