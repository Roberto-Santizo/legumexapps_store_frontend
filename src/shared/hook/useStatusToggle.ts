import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

type StatusToggleOptions = {
    mutationFn: (id: number, isActive: boolean) => Promise<{ message: string }>
    invalidateKey: string
}

export function useStatusToggle({ mutationFn, invalidateKey }: StatusToggleOptions) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => mutationFn(id, isActive),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [invalidateKey] })
            toast.success(data.message)
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    function toggle(id: number, displayName: string, isActive: boolean) {
        if (isActive && !window.confirm(t("common.confirmDeactivate", { name: displayName }))) return
        mutation.mutate({ id, isActive: !isActive })
    }

    return { isPending: mutation.isPending, toggle }
}
