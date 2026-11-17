import type { ReactNode, SubmitEventHandler } from "react"
import { LogIn, ShieldAlert } from "lucide-react"
import { Button } from "@/shared/component/button.component"
import { LegumexLogoStacked } from "@/shared/component/legumexLogoStacked.component"

type AuthCardProps = {
    headerExtra?: ReactNode
    brandSubtitle: string
    title: string
    subtitle: string
    lockedMessage?: string | null
    onSubmit: SubmitEventHandler<HTMLFormElement>
    isSubmitting: boolean
    submitLabel: string
    submittingLabel: string
    children: ReactNode
    insideFooter?: ReactNode
    outsideFooter?: ReactNode
}

export function AuthCard({
    headerExtra,
    brandSubtitle,
    title,
    subtitle,
    lockedMessage,
    onSubmit,
    isSubmitting,
    submitLabel,
    submittingLabel,
    children,
    insideFooter,
    outsideFooter,
}: Readonly<AuthCardProps>) {
    return (
        <div className="auth-theme relative flex min-h-screen items-center justify-center overflow-hidden bg-[#e7eee2] p-4">
            <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-300/40 blur-3xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl"
            />

            <div className="relative w-full max-w-sm">
                <div className="overflow-hidden rounded-panel border border-brand-300/50 bg-[#f4f6ef] shadow-[0_24px_80px_-32px_rgba(4,78,39,0.3)]">
                    <div className="relative bg-linear-to-br from-brand-900 via-[#07562e] to-brand-700 px-6 py-7 text-center sm:py-8">
                        <div className="absolute inset-x-0 top-0 h-1 bg-brand-500" />
                        {headerExtra && <div className="absolute right-4 top-4">{headerExtra}</div>}
                        <LegumexLogoStacked size="login" className="mx-auto mb-4" />
                        <p className="text-sm font-semibold text-white/75">{brandSubtitle}</p>
                    </div>

                    <form className="bg-[#f4f6ef] px-6 py-9" onSubmit={onSubmit} autoComplete="on" noValidate>
                        <div className="mb-6">
                            <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
                            <p className="text-sm text-ink-600">{subtitle}</p>
                        </div>

                        {lockedMessage && (
                            <div className="mb-5 flex items-start gap-2 rounded-control border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning-fg">
                                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{lockedMessage}</span>
                            </div>
                        )}

                        {children}

                        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
                            {isSubmitting ? (
                                submittingLabel
                            ) : (
                                <>
                                    <LogIn className="h-4 w-4" />
                                    {submitLabel}
                                </>
                            )}
                        </Button>

                        {insideFooter}
                    </form>
                </div>

                {outsideFooter && <div className="mt-6 text-center">{outsideFooter}</div>}
            </div>
        </div>
    )
}
