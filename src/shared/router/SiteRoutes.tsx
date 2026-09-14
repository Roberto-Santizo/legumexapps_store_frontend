import { Suspense } from "react"
import { Route } from "react-router-dom"
import { SiteLayout } from "@/shared/layout/SiteLayout"
import { Spinner } from "@/shared/component/spinner.component"
import { CustomerProtectedRoute } from "@/shared/auth/customer/CustomerProtectedRoute"
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
                    <CustomerProtectedRoute>
                        <Suspense fallback={<Spinner />}>
                            <QuoteRequestPage />
                        </Suspense>
                    </CustomerProtectedRoute>
                }
            />
        </Route>
    )
}
