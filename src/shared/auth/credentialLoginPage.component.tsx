import { showErrorToast } from "@/shared/i18n/showErrorToast"
import type { ReactNode } from "react"
import { useForm } from "react-hook-form"
import type { DefaultValues, FieldError, FieldValues, Path } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { useLocation, useNavigate } from "react-router-dom"
import type { Location } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { LucideIcon } from "lucide-react"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { PasswordInput } from "@/shared/component/passwordInput.component"
import { AuthCard } from "@/shared/component/authCard.component"

const ACCOUNT_LOCKED_STATUS = 423

type LoginRequest = FieldValues & { password: string }

type CredentialLoginPageProps<TRequest extends LoginRequest, TSession> = {
    /** Translation namespace with brand/title/labels/placeholders/submit keys (e.g. "auth.adminLogin"). */
    i18nPrefix: string
    schema: z.ZodType<TRequest, TRequest>
    defaultValues: DefaultValues<TRequest>
    loginAPI: (request: TRequest) => Promise<{ data: TSession }>
    isApiError: (error: unknown) => error is Error & { status: number }
    onLogin: (session: TSession) => void
    /** Where to go after logging in when the user wasn't redirected here from a protected page. */
    fallbackPath: string
    /** The username/email field; the password field is always the same. */
    identifier: {
        name: Path<TRequest> & keyof TRequest
        type: "text" | "email"
        icon: LucideIcon
        preserveCase?: boolean
    }
    headerExtra?: ReactNode
    insideFooter?: ReactNode
    outsideFooter?: ReactNode
}

// Shared by the staff login and the salesperson (Legumex rep) login: same card, same two fields, same
// "account locked" banner and same "back to where you were" redirect; only the API, session store,
// translations and identifier field differ.
export function CredentialLoginPage<TRequest extends LoginRequest, TSession>({
    i18nPrefix,
    schema,
    defaultValues,
    loginAPI,
    isApiError,
    onLogin,
    fallbackPath,
    identifier,
    headerExtra,
    insideFooter,
    outsideFooter,
}: Readonly<CredentialLoginPageProps<TRequest, TSession>>) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const key = (name: string) => `${i18nPrefix}.${name}`

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<TRequest>({
        resolver: zodResolver(schema),
        defaultValues,
    })

    const loginMutation = useMutation({
        mutationFn: loginAPI,
        onSuccess: ({ data }) => {
            onLogin(data)
            const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? fallbackPath
            navigate(redirectTo, { replace: true })
        },
        onError: (error) => {
            showErrorToast(error)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        loginMutation.mutate(formData)
    })

    const { error } = loginMutation
    const lockedError = isApiError(error) && error.status === ACCOUNT_LOCKED_STATUS ? error : null
    const identifierName = String(identifier.name)
    const identifierError = errors[identifier.name] as FieldError | undefined
    const passwordError = errors.password as FieldError | undefined
    const IdentifierIcon = identifier.icon

    return (
        <AuthCard
            headerExtra={headerExtra}
            brandTitle={t(key("brand"))}
            brandSubtitle={t(key("brandSubtitle"))}
            title={t(key("title"))}
            subtitle={t(key("subtitle"))}
            lockedMessage={lockedError?.message}
            onSubmit={onSubmit}
            isSubmitting={loginMutation.isPending}
            submitLabel={t(key("submit"))}
            submittingLabel={t(key("submitting"))}
            insideFooter={insideFooter}
            outsideFooter={outsideFooter}
        >
            <FormField label={t(key(identifierName))} htmlFor={identifierName} error={getFieldErrorMessage(t, identifierError)} required>
                <div className="relative">
                    <IdentifierIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
                    <Input
                        id={identifierName}
                        type={identifier.type}
                        placeholder={t(key(`${identifierName}Placeholder`))}
                        autoComplete={identifierName}
                        autoFocus
                        hasError={!!identifierError}
                        className="pl-11"
                        preserveCase={identifier.preserveCase}
                        {...register(identifier.name)}
                    />
                </div>
            </FormField>

            <FormField label={t(key("password"))} htmlFor="password" error={getFieldErrorMessage(t, passwordError)} required>
                <PasswordInput
                    id="password"
                    placeholder={t(key("passwordPlaceholder"))}
                    hasError={!!passwordError}
                    hidePasswordLabel={t(key("hidePassword"))}
                    showPasswordLabel={t(key("showPassword"))}
                    {...register("password" as Path<TRequest>)}
                />
            </FormField>
        </AuthCard>
    )
}
