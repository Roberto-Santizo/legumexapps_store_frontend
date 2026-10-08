import { Suspense } from "react"
import { Route, Routes } from "react-router-dom"
import SiteRoutes from "@/shared/router/SiteRoutes"
import AdminRoutes from "@/shared/router/AdminRoutes"
import { lazyWithRetry } from "@/shared/router/lazyWithRetry"
import { Spinner } from "@/shared/component/spinner.component"
import { PublicOnlyRoute } from "@/shared/auth/PublicOnlyRoute"
import { SalespersonPublicOnlyRoute } from "@/shared/auth/salesperson/SalespersonPublicOnlyRoute"

const NotFoundPage = lazyWithRetry(() => import("@/shared/page/notFound.page").then((m) => ({ default: m.NotFoundPage })))
const LoginPage = lazyWithRetry(() => import("@/feature/login/page/login.page").then((m) => ({ default: m.LoginPage })))
const SalespersonLoginPage = lazyWithRetry(() =>
    import("@/feature/salespersonAuth/page/salespersonLogin.page").then((m) => ({ default: m.SalespersonLoginPage }))
)

export default function AppRouter() {
    return (
        <Routes>
            {SiteRoutes()}
            {AdminRoutes()}
            <Route
                path="/admin/login"
                element={
                    <PublicOnlyRoute>
                        <Suspense fallback={<Spinner />}>
                            <LoginPage />
                        </Suspense>
                    </PublicOnlyRoute>
                }
            />
            <Route
                path="/iniciar-sesion"
                element={
                    <SalespersonPublicOnlyRoute>
                        <Suspense fallback={<Spinner />}>
                            <SalespersonLoginPage />
                        </Suspense>
                    </SalespersonPublicOnlyRoute>
                }
            />
            <Route
                path="*"
                element={
                    <Suspense fallback={<Spinner />}>
                        <NotFoundPage />
                    </Suspense>
                }
            />
        </Routes>
    )
}
