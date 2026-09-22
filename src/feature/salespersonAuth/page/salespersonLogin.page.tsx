import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Link, useLocation, useNavigate } from "react-router-dom"
import type { Location } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Mail } from "lucide-react"
import { salespersonLoginRequestSchema } from "@/feature/salespersonAuth/schema/salespersonLogin.schema"
import type { SalespersonLoginRequest } from "@/feature/salespersonAuth/schema/salespersonLogin.schema"
import { salespersonLoginAPI, isSalespersonLoginApiError } from "@/feature/salespersonAuth/api/salespersonLogin.api"
import { useSalespersonAuth } from "@/shared/auth/salesperson/useSalespersonAuth"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { PasswordInput } from "@/shared/component/passwordInput.component"
import { AuthCard } from "@/shared/component/authCard.component"

const ACCOUNT_LOCKED_STATUS = 423

export function SalespersonLoginPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const { login } = useSalespersonAuth()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SalespersonLoginRequest>({
        resolver: zodResolver(salespersonLoginRequestSchema),
        defaultValues: { email: "", password: "" },
    })

    const loginMutation = useMutation({
        mutationFn: salespersonLoginAPI,
        onSuccess: ({ data }) => {
            login(data)
            const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? "/solicitud"
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
    const lockedError = isSalespersonLoginApiError(error) && error.status === ACCOUNT_LOCKED_STATUS ? error : null

    return (
        <AuthCard
            brandTitle={t("auth.salespersonLogin.brand")}
            brandSubtitle={t("auth.salespersonLogin.brandSubtitle")}
            title={t("auth.salespersonLogin.title")}
            subtitle={t("auth.salespersonLogin.subtitle")}
            lockedMessage={lockedError?.message}
            onSubmit={onSubmit}
            isSubmitting={loginMutation.isPending}
            submitLabel={t("auth.salespersonLogin.submit")}
            submittingLabel={t("auth.salespersonLogin.submitting")}
            insideFooter={<p className="mt-5 text-center text-sm text-texto-suave">{t("auth.salespersonLogin.noAccount")}</p>}
            outsideFooter={
                <Link
                    to="/"
                    className="text-sm font-semibold text-verde-profundo underline decoration-dorado decoration-2 underline-offset-4"
                >
                    {t("auth.salespersonLogin.backHome")}
                </Link>
            }
        >
            <FormField label={t("auth.salespersonLogin.email")} htmlFor="email" error={getFieldErrorMessage(t, errors.email)} required>
                <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-suave" />
                    <Input
                        id="email"
                        type="email"
                        placeholder={t("auth.salespersonLogin.emailPlaceholder")}
                        autoComplete="email"
                        autoFocus
                        hasError={!!errors.email}
                        className="pl-11"
                        {...register("email")}
                    />
                </div>
            </FormField>

            <FormField label={t("auth.salespersonLogin.password")} htmlFor="password" error={getFieldErrorMessage(t, errors.password)} required>
                <PasswordInput
                    id="password"
                    placeholder={t("auth.salespersonLogin.passwordPlaceholder")}
                    hasError={!!errors.password}
                    hidePasswordLabel={t("auth.salespersonLogin.hidePassword")}
                    showPasswordLabel={t("auth.salespersonLogin.showPassword")}
                    {...register("password")}
                />
            </FormField>
        </AuthCard>
    )
}
