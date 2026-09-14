import { Component, type ErrorInfo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { buttonClassName } from "@/shared/component/buttonClassName"

interface ErrorBoundaryProps {
    children: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
}

function ErrorFallback() {
    const { t } = useTranslation()

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-crema px-4 text-center">
            <p className="max-w-sm text-lg font-semibold text-verde-profundo">{t("errorBoundary.message")}</p>
            <button type="button" onClick={() => window.location.reload()} className={buttonClassName("primary")}>
                {t("errorBoundary.reload")}
            </button>
        </div>
    )
}

/**
 * Top-level safety net: catches whatever the chunk-load auto-reload in lazyWithRetry doesn't
 * (a second failure right after that reload, or any other render/load error) and shows a small
 * friendly fallback instead of a blank white screen. Reloading the current page is the correct
 * recovery here — the user hasn't lost their session, so this never redirects to login.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Unhandled error caught by ErrorBoundary:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return <ErrorFallback />
        }

        return this.props.children
    }
}
