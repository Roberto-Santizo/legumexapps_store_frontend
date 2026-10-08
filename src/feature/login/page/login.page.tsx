import { useTranslation } from "react-i18next"
import { User } from "lucide-react"
import { loginRequestSchema } from "@/feature/login/schema/login.schema"
import { isLoginApiError, loginAPI } from "@/feature/login/api/login.api"
import { useAuth } from "@/shared/auth/useAuth"
import { CredentialLoginPage } from "@/shared/auth/credentialLoginPage.component"
import { LanguageSwitch } from "@/shared/layout/LanguageSwitch"

export function LoginPage() {
    const { t } = useTranslation()
    const { login } = useAuth()

    return (
        <CredentialLoginPage
            i18nPrefix="auth.adminLogin"
            schema={loginRequestSchema}
            defaultValues={{ username: "", password: "" }}
            loginAPI={loginAPI}
            isApiError={isLoginApiError}
            onLogin={login}
            fallbackPath="/admin"
            identifier={{ name: "username", type: "text", icon: User, preserveCase: true }}
            headerExtra={<LanguageSwitch tone="dark" />}
            outsideFooter={
                <p className="text-sm text-ink-600">{t("auth.adminLogin.footer", { year: new Date().getFullYear() })}</p>
            }
        />
    )
}
