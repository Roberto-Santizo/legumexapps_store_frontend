import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Mail } from "lucide-react"
import { salespersonLoginRequestSchema } from "@/feature/salespersonAuth/schema/salespersonLogin.schema"
import { salespersonLoginAPI, isSalespersonLoginApiError } from "@/feature/salespersonAuth/api/salespersonLogin.api"
import { useSalespersonAuth } from "@/shared/auth/salesperson/useSalespersonAuth"
import { CredentialLoginPage } from "@/shared/auth/credentialLoginPage.component"

export function SalespersonLoginPage() {
    const { t } = useTranslation()
    const { login } = useSalespersonAuth()

    return (
        <CredentialLoginPage
            i18nPrefix="auth.salespersonLogin"
            schema={salespersonLoginRequestSchema}
            defaultValues={{ email: "", password: "" }}
            loginAPI={salespersonLoginAPI}
            isApiError={isSalespersonLoginApiError}
            onLogin={login}
            fallbackPath="/solicitud"
            identifier={{ name: "email", type: "email", icon: Mail }}
            insideFooter={<p className="mt-5 text-center text-sm text-ink-600">{t("auth.salespersonLogin.noAccount")}</p>}
            outsideFooter={
                <Link
                    to="/"
                    className="text-sm font-semibold text-ink-900 underline decoration-brand-500 decoration-2 underline-offset-4"
                >
                    {t("auth.salespersonLogin.backHome")}
                </Link>
            }
        />
    )
}
