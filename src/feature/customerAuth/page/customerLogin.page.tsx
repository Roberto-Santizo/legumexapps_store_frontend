import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Link, useLocation, useNavigate } from "react-router-dom"
import type { Location } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Mail } from "lucide-react"
import { customerLoginRequestSchema } from "@/feature/customerAuth/schema/customerLogin.schema"
import type { CustomerLoginRequest } from "@/feature/customerAuth/schema/customerLogin.schema"
import { customerLoginAPI, isCustomerLoginApiError } from "@/feature/customerAuth/api/customerLogin.api"
import { useCustomerAuth } from "@/shared/auth/customer/useCustomerAuth"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { PasswordInput } from "@/shared/component/passwordInput.component"
import { AuthCard } from "@/shared/component/authCard.component"

const ACCOUNT_LOCKED_STATUS = 423

export function CustomerLoginPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const { login } = useCustomerAuth()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CustomerLoginRequest>({
        resolver: zodResolver(customerLoginRequestSchema),
        defaultValues: { email: "", password: "" },
    })

    const loginMutation = useMutation({
        mutationFn: customerLoginAPI,
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
    const lockedError = isCustomerLoginApiError(error) && error.status === ACCOUNT_LOCKED_STATUS ? error : null

    return (
        <AuthCard
            brandTitle={t("auth.customerLogin.brand")}
            brandSubtitle={t("auth.customerLogin.brandSubtitle")}
            title={t("auth.customerLogin.title")}
            subtitle={t("auth.customerLogin.subtitle")}
            lockedMessage={lockedError?.message}
            onSubmit={onSubmit}
            isSubmitting={loginMutation.isPending}
            submitLabel={t("auth.customerLogin.submit")}
            submittingLabel={t("auth.customerLogin.submitting")}
            insideFooter={<p className="mt-5 text-center text-sm text-texto-suave">{t("auth.customerLogin.noAccount")}</p>}
            outsideFooter={
                <Link
                    to="/"
                    className="text-sm font-semibold text-verde-profundo underline decoration-dorado decoration-2 underline-offset-4"
                >
                    {t("auth.customerLogin.backHome")}
                </Link>
            }
        >
            <FormField label={t("auth.customerLogin.email")} htmlFor="email" error={getFieldErrorMessage(t, errors.email)}>
                <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-suave" />
                    <Input
                        id="email"
                        type="email"
                        placeholder={t("auth.customerLogin.emailPlaceholder")}
                        autoComplete="email"
                        autoFocus
                        hasError={!!errors.email}
                        className="pl-11"
                        {...register("email")}
                    />
                </div>
            </FormField>

            <FormField label={t("auth.customerLogin.password")} htmlFor="password" error={getFieldErrorMessage(t, errors.password)}>
                <PasswordInput
                    id="password"
                    placeholder={t("auth.customerLogin.passwordPlaceholder")}
                    hasError={!!errors.password}
                    hidePasswordLabel={t("auth.customerLogin.hidePassword")}
                    showPasswordLabel={t("auth.customerLogin.showPassword")}
                    {...register("password")}
                />
            </FormField>
        </AuthCard>
    )
}
