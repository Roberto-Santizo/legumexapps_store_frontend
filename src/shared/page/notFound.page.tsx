import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function NotFoundPage() {
    const { t } = useTranslation()

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <h1 className="text-4xl font-semibold text-verde-profundo">404</h1>
            <p className="text-texto-suave">{t("notFound.message")}</p>
            <Link to="/" className={buttonClassName("primary")}>
                {t("notFound.backLink")}
            </Link>
        </div>
    )
}
