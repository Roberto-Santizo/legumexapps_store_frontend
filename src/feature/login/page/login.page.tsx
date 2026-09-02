import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useLocation, useNavigate } from "react-router-dom"
import type { Location } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { User } from "lucide-react"
import { loginRequestSchema } from "@/feature/login/schema/login.schema"
import type { LoginRequest } from "@/feature/login/schema/login.schema"
import { isLoginApiError, loginAPI } from "@/feature/login/api/login.api"
import { useAuth } from "@/shared/auth/useAuth"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { PasswordInput } from "@/shared/component/passwordInput.component"
import { AuthCard } from "@/shared/component/authCard.component"
import { LanguageSwitch } from "@/shared/layout/LanguageSwitch"

const ACCOUNT_LOCKED_STATUS = 423

export function LoginPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const { login } = useAuth()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginRequest>({
        resolver: zodResolver(loginRequestSchema),
        defaultValues: { username: "", password: "" },
    })

    const loginMutation = useMutation({
        mutationFn: loginAPI,
        onSuccess: ({ data }) => {
            login(data)
            const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? "/admin"
            navigate(redirectTo, { replace: true })
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        loginMutation.mutate(formData)
    })

    const { error } = loginMutation
    const lockedError = isLoginApiError(error) && error.status === ACCOUNT_LOCKED_STATUS ? error : null

    return (
        <AuthCard
            headerExtra={<LanguageSwitch tone="dark" />}
            brandTitle={t("auth.adminLogin.brand")}
            brandSubtitle={t("auth.adminLogin.brandSubtitle")}
            title={t("auth.adminLogin.title")}
            subtitle={t("auth.adminLogin.subtitle")}
            lockedMessage={lockedError?.message}
            onSubmit={onSubmit}
            isSubmitting={loginMutation.isPending}
            submitLabel={t("auth.adminLogin.submit")}
            submittingLabel={t("auth.adminLogin.submitting")}
            outsideFooter={
                <p className="text-sm text-texto-suave">{t("auth.adminLogin.footer", { year: new Date().getFullYear() })}</p>
            }
        >
            <FormField label={t("auth.adminLogin.username")} htmlFor="username" error={getFieldErrorMessage(t, errors.username)}>
                <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-suave" />
                    <Input
                        id="username"
                        type="text"
                        placeholder={t("auth.adminLogin.usernamePlaceholder")}
                        autoComplete="username"
                        autoFocus
                        hasError={!!errors.username}
                        className="pl-11"
                        preserveCase
                        {...register("username")}
                    />
                </div>
            </FormField>

            <FormField label={t("auth.adminLogin.password")} htmlFor="password" error={getFieldErrorMessage(t, errors.password)}>
                <PasswordInput
                    id="password"
                    placeholder={t("auth.adminLogin.passwordPlaceholder")}
                    hasError={!!errors.password}
                    hidePasswordLabel={t("auth.adminLogin.hidePassword")}
                    showPasswordLabel={t("auth.adminLogin.showPassword")}
                    {...register("password")}
                />
            </FormField>
        </AuthCard>
    )
}
