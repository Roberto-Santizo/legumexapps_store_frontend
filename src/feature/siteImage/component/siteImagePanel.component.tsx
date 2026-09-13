import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { getSiteImagesAPI, updateSiteImageAPI } from "@/feature/siteImage/api/adminSiteImage.api"
import type { SiteImageResponse } from "@/feature/siteImage/schema/siteImage.schema"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { ImageUploadField } from "@/shared/component/imageUploadField.component"

type SiteImageSlotCardProps = {
    siteImage: SiteImageResponse
}

// undefined = "sin cambios pendientes" (el mismo contrato que ImageUploadField ya usa para
// "no tocar" vs. base64 nueva vs. null para borrar -- ver resolveCatalogImage.ts en el backend).
function SiteImageSlotCard({ siteImage }: Readonly<SiteImageSlotCardProps>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [pendingImage, setPendingImage] = useState<string | null | undefined>(undefined)

    const updateMutation = useMutation({
        mutationFn: () => updateSiteImageAPI(siteImage.slotKey, { image: pendingImage }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["site-images"] })
            setPendingImage(undefined)
            toast.success(data.message)
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const hasPendingChange = pendingImage !== undefined

    return (
        <Card>
            <h3 className="font-semibold text-verde-profundo">{t(`siteImage.slots.${siteImage.slotKey}`)}</h3>

            <div className="mt-4">
                <ImageUploadField
                    label={t("siteImage.form.image")}
                    value={pendingImage}
                    onChange={setPendingImage}
                    initialImageUrl={siteImage.imageUrl}
                />
            </div>

            {hasPendingChange && (
                <Button type="button" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
                    {updateMutation.isPending ? t("common.saving") : t("common.save")}
                </Button>
            )}
        </Card>
    )
}

export function SiteImagePanel() {
    const { t } = useTranslation()
    const siteImagesQuery = useQuery({ queryKey: ["site-images", "admin"], queryFn: getSiteImagesAPI })

    if (siteImagesQuery.isLoading) return <p className="text-texto-suave">{t("common.loading")}</p>
    if (siteImagesQuery.isError) return <p className="text-error-fg">{t("common.loadError")}</p>

    const siteImages = siteImagesQuery.data?.data ?? []

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {siteImages.map((siteImage) => (
                <SiteImageSlotCard key={siteImage.slotKey} siteImage={siteImage} />
            ))}
        </div>
    )
}
