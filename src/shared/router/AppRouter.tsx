import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router-dom"
import SiteRoutes from "@/shared/router/SiteRoutes"
import AdminRoutes from "@/shared/router/AdminRoutes"
import { Spinner } from "@/shared/component/spinner.component"
import { PublicOnlyRoute } from "@/shared/auth/PublicOnlyRoute"
import { CustomerPublicOnlyRoute } from "@/shared/auth/customer/CustomerPublicOnlyRoute"

const NotFoundPage = lazy(() => import("@/shared/page/notFound.page").then((m) => ({ default: m.NotFoundPage })))
const LoginPage = lazy(() => import("@/feature/login/page/login.page").then((m) => ({ default: m.LoginPage })))
const CustomerLoginPage = lazy(() =>
    import("@/feature/customerAuth/page/customerLogin.page").then((m) => ({ default: m.CustomerLoginPage }))
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
                    <CustomerPublicOnlyRoute>
                        <Suspense fallback={<Spinner />}>
                            <CustomerLoginPage />
                        </Suspense>
                    </CustomerPublicOnlyRoute>
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
