import { Suspense } from "react"
import { Route } from "react-router-dom"
import { SiteLayout } from "@/shared/layout/SiteLayout"
import { Spinner } from "@/shared/component/spinner.component"
import { SalespersonProtectedRoute } from "@/shared/auth/salesperson/SalespersonProtectedRoute"
import { lazyWithRetry } from "@/shared/router/lazyWithRetry"

const HomePage = lazyWithRetry(() => import("@/feature/home/page/home.page").then((m) => ({ default: m.HomePage })))
const QuoteRequestPage = lazyWithRetry(() =>
    import("@/feature/quote/page/quoteRequest.page").then((m) => ({ default: m.QuoteRequestPage }))
)

export default function SiteRoutes() {
    return (
        <Route element={<SiteLayout />}>
            <Route
                path="/"
                element={
                    <Suspense fallback={<Spinner />}>
                        <HomePage />
                    </Suspense>
                }
            />
            <Route
                path="/solicitud"
                element={
                    <SalespersonProtectedRoute>
                        <Suspense fallback={<Spinner />}>
                            <QuoteRequestPage />
                        </Suspense>
                    </SalespersonProtectedRoute>
                }
            />
        </Route>
    )
}
