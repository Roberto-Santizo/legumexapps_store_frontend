import { Link } from "react-router-dom"
import { ClipboardList, ShoppingCart } from "lucide-react"
import { useTranslation } from "react-i18next"
import { isB2cMode } from "@/shared/config/salesMode.config"

type SiteRequestButtonProps = {
    itemCount?: number
}

export function SiteRequestButton({ itemCount = 0 }: Readonly<SiteRequestButtonProps>) {
    const { t } = useTranslation()
    const RequestIcon = isB2cMode() ? ShoppingCart : ClipboardList

    return (
        <Link
            to="/solicitud"
            aria-label={t(isB2cMode() ? "site.header.cart" : "site.header.request")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-verde-profundo transition hover:bg-crema"
        >
            <RequestIcon size={20} />
            {itemCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-dorado font-mono text-[10px] font-medium text-verde-profundo">
                    {itemCount}
                </span>
            )}
        </Link>
    )
}
