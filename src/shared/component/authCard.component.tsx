import type { ReactNode, SubmitEventHandler } from "react"
import { LogIn, ShieldAlert } from "lucide-react"
import { Button } from "@/shared/component/button.component"

type AuthCardProps = {
    headerExtra?: ReactNode
    brandTitle: string
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
    brandTitle,
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
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-crema p-4">
            <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brote/20 blur-3xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-dorado/20 blur-3xl"
            />

            <div className="relative w-full max-w-sm">
                <div className="overflow-hidden rounded-card border border-gris-campo/60 bg-hueso shadow-card">
                    <div className="relative bg-linear-to-br from-verde-profundo to-verde-tinta px-6 py-10 text-center">
                        <div className="absolute inset-x-0 top-0 h-1 bg-dorado" />
                        {headerExtra && <div className="absolute right-4 top-4">{headerExtra}</div>}
                        <img
                            src={import.meta.env.VITE_IMAGE_LOGO}
                            alt="Legumex Logo"
                            className="mx-auto h-20 w-28 object-contain"
                        />
                        <p className="font-display text-2xl font-bold tracking-tight text-crema">{brandTitle}</p>
                        <p className="mt-1 text-sm font-medium text-crema/70">{brandSubtitle}</p>
                    </div>

                    <form className="px-6 py-9" onSubmit={onSubmit} autoComplete="on" noValidate>
                        <div className="mb-6">
                            <h1 className="text-xl font-semibold text-verde-profundo">{title}</h1>
                            <p className="text-sm text-texto-suave">{subtitle}</p>
                        </div>

                        {lockedMessage && (
                            <div className="mb-5 flex items-start gap-2 rounded-[10px] border border-aviso-bd bg-aviso-bg px-4 py-3 text-sm text-aviso-fg">
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
