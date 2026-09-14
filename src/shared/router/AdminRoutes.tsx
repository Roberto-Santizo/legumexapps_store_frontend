import { Suspense } from "react"
import { Navigate, Route } from "react-router-dom"
import { AppLayout } from "@/shared/layout/AppLayout"
import { Spinner } from "@/shared/component/spinner.component"
import { ProtectedRoute } from "@/shared/auth/ProtectedRoute"
import { AccessDenied, PermissionGate } from "@/shared/auth/PermissionGate"
import { usePermission } from "@/shared/auth/usePermission"
import { lazyWithRetry } from "@/shared/router/lazyWithRetry"

const CategoryListPage = lazyWithRetry(() =>
    import("@/feature/category/page/category.page").then((module) => ({ default: module.CategoryListPage }))
)
const CreateCategoryPage = lazyWithRetry(() =>
    import("@/feature/category/page/createCategory.page").then((module) => ({ default: module.CreateCategoryPage }))
)
const EditCategoryPage = lazyWithRetry(() =>
    import("@/feature/category/page/editCategory.page").then((module) => ({ default: module.EditCategoryPage }))
)

const SubCategoryListPage = lazyWithRetry(() =>
    import("@/feature/category/page/subCategory.page").then((module) => ({ default: module.SubCategoryListPage }))
)
const CreateSubCategoryPage = lazyWithRetry(() =>
    import("@/feature/category/page/createSubCategory.page").then((module) => ({ default: module.CreateSubCategoryPage }))
)
const EditSubCategoryPage = lazyWithRetry(() =>
    import("@/feature/category/page/editSubCategory.page").then((module) => ({ default: module.EditSubCategoryPage }))
)

const ProductTypeListPage = lazyWithRetry(() =>
    import("@/feature/product-type/page/productType.page").then((module) => ({ default: module.ProductTypeListPage }))
)
const CreateProductTypePage = lazyWithRetry(() =>
    import("@/feature/product-type/page/createProductType.page").then((module) => ({ default: module.CreateProductTypePage }))
)
const EditProductTypePage = lazyWithRetry(() =>
    import("@/feature/product-type/page/editProductType.page").then((module) => ({ default: module.EditProductTypePage }))
)

const UnitListPage = lazyWithRetry(() =>
    import("@/feature/unit/page/unit.page").then((module) => ({ default: module.UnitListPage }))
)
const CreateUnitPage = lazyWithRetry(() =>
    import("@/feature/unit/page/createUnit.page").then((module) => ({ default: module.CreateUnitPage }))
)
const EditUnitPage = lazyWithRetry(() =>
    import("@/feature/unit/page/editUnit.page").then((module) => ({ default: module.EditUnitPage }))
)

const IngredientListPage = lazyWithRetry(() =>
    import("@/feature/ingredient/page/ingredient.page").then((module) => ({ default: module.IngredientListPage }))
)
const CreateIngredientPage = lazyWithRetry(() =>
    import("@/feature/ingredient/page/createIngredient.page").then((module) => ({ default: module.CreateIngredientPage }))
)
const EditIngredientPage = lazyWithRetry(() =>
    import("@/feature/ingredient/page/editIngredient.page").then((module) => ({ default: module.EditIngredientPage }))
)

const PackagingListPage = lazyWithRetry(() =>
    import("@/feature/packaging/page/packaging.page").then((module) => ({ default: module.PackagingListPage }))
)
const CreatePackagingPage = lazyWithRetry(() =>
    import("@/feature/packaging/page/createPackaging.page").then((module) => ({ default: module.CreatePackagingPage }))
)
const EditPackagingPage = lazyWithRetry(() =>
    import("@/feature/packaging/page/editPackaging.page").then((module) => ({ default: module.EditPackagingPage }))
)

const DestinationListPage = lazyWithRetry(() =>
    import("@/feature/destination/page/destination.page").then((module) => ({ default: module.DestinationListPage }))
)
const CreateDestinationPage = lazyWithRetry(() =>
    import("@/feature/destination/page/createDestination.page").then((module) => ({ default: module.CreateDestinationPage }))
)
const EditDestinationPage = lazyWithRetry(() =>
    import("@/feature/destination/page/editDestination.page").then((module) => ({ default: module.EditDestinationPage }))
)

const ProcessingCostListPage = lazyWithRetry(() =>
    import("@/feature/processingCost/page/processingCost.page").then((module) => ({ default: module.ProcessingCostListPage }))
)
const CreateProcessingCostPage = lazyWithRetry(() =>
    import("@/feature/processingCost/page/createProcessingCost.page").then((module) => ({ default: module.CreateProcessingCostPage }))
)
const EditProcessingCostPage = lazyWithRetry(() =>
    import("@/feature/processingCost/page/editProcessingCost.page").then((module) => ({ default: module.EditProcessingCostPage }))
)

const PresentationListPage = lazyWithRetry(() =>
    import("@/feature/presentation/page/presentation.page").then((module) => ({ default: module.PresentationListPage }))
)
const CreatePresentationPage = lazyWithRetry(() =>
    import("@/feature/presentation/page/createPresentation.page").then((module) => ({ default: module.CreatePresentationPage }))
)
const EditPresentationPage = lazyWithRetry(() =>
    import("@/feature/presentation/page/editPresentation.page").then((module) => ({ default: module.EditPresentationPage }))
)

const ProductListPage = lazyWithRetry(() =>
    import("@/feature/product/page/product.page").then((module) => ({ default: module.ProductListPage }))
)
const CreateProductPage = lazyWithRetry(() =>
    import("@/feature/product/page/createProduct.page").then((module) => ({ default: module.CreateProductPage }))
)
const EditProductPage = lazyWithRetry(() =>
    import("@/feature/product/page/editProduct.page").then((module) => ({ default: module.EditProductPage }))
)

const UserListPage = lazyWithRetry(() => import("@/feature/user/page/user.page").then((module) => ({ default: module.UserListPage })))
const CreateUserPage = lazyWithRetry(() =>
    import("@/feature/user/page/createUser.page").then((module) => ({ default: module.CreateUserPage }))
)
const EditUserPage = lazyWithRetry(() => import("@/feature/user/page/editUser.page").then((module) => ({ default: module.EditUserPage })))

const RoleListPage = lazyWithRetry(() => import("@/feature/role/page/role.page").then((module) => ({ default: module.RoleListPage })))
const CreateRolePage = lazyWithRetry(() =>
    import("@/feature/role/page/createRole.page").then((module) => ({ default: module.CreateRolePage }))
)
const EditRolePage = lazyWithRetry(() => import("@/feature/role/page/editRole.page").then((module) => ({ default: module.EditRolePage })))

const DashboardPage = lazyWithRetry(() =>
    import("@/feature/dashboard/page/dashboard.page").then((module) => ({ default: module.DashboardPage }))
)

const AdminQuoteListPage = lazyWithRetry(() =>
    import("@/feature/quote/page/adminQuote.page").then((module) => ({ default: module.AdminQuoteListPage }))
)
const AdminQuoteCalculatorPage = lazyWithRetry(() =>
    import("@/feature/quote/page/adminQuoteCalculator.page").then((module) => ({ default: module.AdminQuoteCalculatorPage }))
)

const CustomerListPage = lazyWithRetry(() =>
    import("@/feature/customer/page/customer.page").then((module) => ({ default: module.CustomerListPage }))
)
const CreateCustomerPage = lazyWithRetry(() =>
    import("@/feature/customer/page/createCustomer.page").then((module) => ({ default: module.CreateCustomerPage }))
)
const EditCustomerPage = lazyWithRetry(() =>
    import("@/feature/customer/page/editCustomer.page").then((module) => ({ default: module.EditCustomerPage }))
)

const LeadListPage = lazyWithRetry(() => import("@/feature/lead/page/lead.page").then((module) => ({ default: module.LeadListPage })))
const EditLeadPage = lazyWithRetry(() => import("@/feature/lead/page/editLead.page").then((module) => ({ default: module.EditLeadPage })))

const SiteImageListPage = lazyWithRetry(() =>
    import("@/feature/siteImage/page/siteImage.page").then((module) => ({ default: module.SiteImageListPage }))
)

const routes = [
    { path: "dashboard", component: DashboardPage, permission: "dashboard:view" },

    { path: "quotes", component: AdminQuoteListPage, permission: "quotes:view" },
    { path: "quotes/calculator", component: AdminQuoteCalculatorPage, permission: "quotes:calculate" },

    { path: "categories", component: CategoryListPage, permission: "categories:view" },
    { path: "categories/create", component: CreateCategoryPage, permission: "categories:create" },
    { path: "categories/:categoryId/edit", component: EditCategoryPage, permission: "categories:edit" },

    { path: "sub-categories", component: SubCategoryListPage, permission: "subCategories:view" },
    { path: "sub-categories/create", component: CreateSubCategoryPage, permission: "subCategories:create" },
    { path: "sub-categories/:subCategoryId/edit", component: EditSubCategoryPage, permission: "subCategories:edit" },

    { path: "product-types", component: ProductTypeListPage, permission: "productTypes:view" },
    { path: "product-types/create", component: CreateProductTypePage, permission: "productTypes:create" },
    { path: "product-types/:productTypeId/edit", component: EditProductTypePage, permission: "productTypes:edit" },

    { path: "units", component: UnitListPage, permission: "units:view" },
    { path: "units/create", component: CreateUnitPage, permission: "units:create" },
    { path: "units/:unitId/edit", component: EditUnitPage, permission: "units:edit" },

    { path: "ingredients", component: IngredientListPage, permission: "ingredients:view" },
    { path: "ingredients/create", component: CreateIngredientPage, permission: "ingredients:create" },
    { path: "ingredients/:ingredientId/edit", component: EditIngredientPage, permission: "ingredients:edit" },

    { path: "packagings", component: PackagingListPage, permission: "packagings:view" },
    { path: "packagings/create", component: CreatePackagingPage, permission: "packagings:create" },
    { path: "packagings/:packagingId/edit", component: EditPackagingPage, permission: "packagings:edit" },

    { path: "destinations", component: DestinationListPage, permission: "destinations:view" },
    { path: "destinations/create", component: CreateDestinationPage, permission: "destinations:create" },
    { path: "destinations/:destinationId/edit", component: EditDestinationPage, permission: "destinations:edit" },

    { path: "processing-costs", component: ProcessingCostListPage, permission: "processingCosts:view" },
    { path: "processing-costs/create", component: CreateProcessingCostPage, permission: "processingCosts:create" },
    { path: "processing-costs/:processingCostId/edit", component: EditProcessingCostPage, permission: "processingCosts:edit" },

    { path: "presentations", component: PresentationListPage, permission: "presentations:view" },
    { path: "presentations/create", component: CreatePresentationPage, permission: "presentations:create" },
    { path: "presentations/:presentationId/edit", component: EditPresentationPage, permission: "presentations:edit" },

    { path: "products", component: ProductListPage, permission: "products:view" },
    { path: "products/create", component: CreateProductPage, permission: "products:create" },
    { path: "products/:productId/edit", component: EditProductPage, permission: "products:edit" },

    { path: "customers", component: CustomerListPage, permission: "customers:view" },
    { path: "customers/create", component: CreateCustomerPage, permission: "customers:create" },
    { path: "customers/:customerId/edit", component: EditCustomerPage, permission: "customers:edit" },

    { path: "leads", component: LeadListPage, permission: "leads:view" },
    { path: "leads/:leadId/edit", component: EditLeadPage, permission: "leads:edit" },

    { path: "site-images", component: SiteImageListPage, permission: "siteContent:edit" },

    { path: "users", component: UserListPage, permission: "users:view" },
    { path: "users/create", component: CreateUserPage, permission: "users:create" },
    { path: "users/:userId/edit", component: EditUserPage, permission: "users:edit" },

    { path: "roles", component: RoleListPage, permission: "roles:view" },
    { path: "roles/create", component: CreateRolePage, permission: "roles:create" },
    { path: "roles/:roleId/edit", component: EditRolePage, permission: "roles:edit" },
]

function AdminIndexRedirect() {
    const { hasPermission } = usePermission()
    const firstAccessibleSection = routes.find(
        (route) => route.permission.endsWith(":view") && hasPermission(route.permission)
    )

    if (!firstAccessibleSection) {
        return <AccessDenied />
    }

    return <Navigate to={`/admin/${firstAccessibleSection.path}`} replace />
}

export default function AdminRoutes() {
    return (
        <Route
            path="/admin"
            element={
                <ProtectedRoute>
                    <AppLayout />
                </ProtectedRoute>
            }
        >
            <Route index element={<AdminIndexRedirect />} />

            {routes.map(({ path, component: Component, permission }) => (
                <Route
                    key={path}
                    path={path}
                    element={
                        <Suspense fallback={<Spinner />}>
                            <PermissionGate permission={permission}>
                                <Component />
                            </PermissionGate>
                        </Suspense>
                    }
                />
            ))}
        </Route>
    )
}
