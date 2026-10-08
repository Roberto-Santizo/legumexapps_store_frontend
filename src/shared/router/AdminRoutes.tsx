import { Suspense } from "react"
import { Navigate, Route } from "react-router-dom"
import { AppLayout } from "@/shared/layout/AppLayout"
import { Spinner } from "@/shared/component/spinner.component"
import { ProtectedRoute } from "@/shared/auth/ProtectedRoute"
import { AccessDenied, PermissionGate } from "@/shared/auth/PermissionGate"
import { usePermission } from "@/shared/auth/usePermission"
import { lazyWithRetry } from "@/shared/router/lazyWithRetry"
const PackagingGroupPage = lazyWithRetry(() => import("@/feature/packagingGroup/page/packagingGroup.page").then(module => ({ default: module.PackagingGroupPage })))

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

const UnitListPage = lazyWithRetry(() =>
    import("@/feature/unit/page/unit.page").then((module) => ({ default: module.UnitListPage }))
)
const CreateUnitPage = lazyWithRetry(() =>
    import("@/feature/unit/page/createUnit.page").then((module) => ({ default: module.CreateUnitPage }))
)
const EditUnitPage = lazyWithRetry(() =>
    import("@/feature/unit/page/editUnit.page").then((module) => ({ default: module.EditUnitPage }))
)

const RawMaterialListPage = lazyWithRetry(() =>
    import("@/feature/rawMaterial/page/rawMaterial.page").then((module) => ({ default: module.RawMaterialListPage }))
)
const CreateRawMaterialPage = lazyWithRetry(() =>
    import("@/feature/rawMaterial/page/createRawMaterial.page").then((module) => ({ default: module.CreateRawMaterialPage }))
)
const EditRawMaterialPage = lazyWithRetry(() =>
    import("@/feature/rawMaterial/page/editRawMaterial.page").then((module) => ({ default: module.EditRawMaterialPage }))
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
    import("@/feature/quote/page/adminQuotes.page").then((module) => ({ default: module.AdminQuotesPage }))
)
const QuoteDraftListPage = lazyWithRetry(() =>
    import("@/feature/quoteDraft/page/quoteDraft.page").then((module) => ({ default: module.QuoteDraftListPage }))
)
const AdminCustomQuoteListPage = lazyWithRetry(() =>
    import("@/feature/quote/page/adminQuotes.page").then((module) => ({ default: module.AdminCustomQuoteListRedirect }))
)
const AdminCustomQuoteDetailPage = lazyWithRetry(() =>
    import("@/feature/customQuote/page/adminCustomQuoteDetail.page").then((module) => ({ default: module.AdminCustomQuoteDetailPage }))
)
const AdminQuoteCalculatorPage = lazyWithRetry(() =>
    import("@/feature/quote/page/adminQuoteCalculator.page").then((module) => ({ default: module.AdminQuoteCalculatorPage }))
)

const SalespersonListPage = lazyWithRetry(() =>
    import("@/feature/salesperson/page/salesperson.page").then((module) => ({ default: module.SalespersonListPage }))
)
const CreateSalespersonPage = lazyWithRetry(() =>
    import("@/feature/salesperson/page/createSalesperson.page").then((module) => ({ default: module.CreateSalespersonPage }))
)
const EditSalespersonPage = lazyWithRetry(() =>
    import("@/feature/salesperson/page/editSalesperson.page").then((module) => ({ default: module.EditSalespersonPage }))
)

const ClientListPage = lazyWithRetry(() =>
    import("@/feature/client/page/client.page").then((module) => ({ default: module.ClientListPage }))
)
const CreateClientPage = lazyWithRetry(() =>
    import("@/feature/client/page/createClient.page").then((module) => ({ default: module.CreateClientPage }))
)
const EditClientPage = lazyWithRetry(() =>
    import("@/feature/client/page/editClient.page").then((module) => ({ default: module.EditClientPage }))
)

const LeadListPage = lazyWithRetry(() => import("@/feature/lead/page/lead.page").then((module) => ({ default: module.LeadListPage })))
const EditLeadPage = lazyWithRetry(() => import("@/feature/lead/page/editLead.page").then((module) => ({ default: module.EditLeadPage })))

const SiteImageListPage = lazyWithRetry(() =>
    import("@/feature/siteImage/page/siteImage.page").then((module) => ({ default: module.SiteImageListPage }))
)

const JuiceListPage = lazyWithRetry(() => import("@/feature/juice/page/juice.page").then(module => ({ default: module.JuiceListPage })))
const JuiceEditorPage = lazyWithRetry(() => import("@/feature/juice/page/juiceEditor.page").then(module => ({ default: module.JuiceEditorPage })))
const JuiceMaterialsPage = lazyWithRetry(() => import("@/feature/juice/page/juiceMaterials.page").then(module => ({ default: module.JuiceMaterialsPage })))
const JuiceConfigPage = lazyWithRetry(() => import("@/feature/juice/page/juiceConfig.page").then(module => ({ default: module.JuiceConfigPage })))

const routes = [
    { path: "dashboard", component: DashboardPage, permission: "dashboard:view" },

    { path: "quotes", component: AdminQuoteListPage, permission: ["quotes:view", "customQuotes:view"] },
    { path: "quote-drafts", component: QuoteDraftListPage, permission: "quoteDrafts:view" },
    { path: "custom-quotes", component: AdminCustomQuoteListPage, permission: "customQuotes:view" },
    { path: "custom-quotes/:customQuoteId", component: AdminCustomQuoteDetailPage, permission: "customQuotes:view" },
    { path: "quotes/calculator", component: AdminQuoteCalculatorPage, permission: "quotes:calculate" },

    { path: "categories", component: CategoryListPage, permission: "categories:view" },
    { path: "categories/create", component: CreateCategoryPage, permission: "categories:create" },
    { path: "categories/:categoryId/edit", component: EditCategoryPage, permission: "categories:edit" },

    { path: "sub-categories", component: SubCategoryListPage, permission: "subCategories:view" },
    { path: "sub-categories/create", component: CreateSubCategoryPage, permission: "subCategories:create" },
    { path: "sub-categories/:subCategoryId/edit", component: EditSubCategoryPage, permission: "subCategories:edit" },

    { path: "units", component: UnitListPage, permission: "units:view" },
    { path: "units/create", component: CreateUnitPage, permission: "units:create" },
    { path: "units/:unitId/edit", component: EditUnitPage, permission: "units:edit" },

    { path: "raw-materials", component: RawMaterialListPage, permission: "rawMaterials:view" },
    { path: "raw-materials/create", component: CreateRawMaterialPage, permission: "rawMaterials:create" },
    { path: "raw-materials/:rawMaterialId/edit", component: EditRawMaterialPage, permission: "rawMaterials:edit" },
    { path: "ingredients", component: IngredientListPage, permission: "ingredients:view" },
    { path: "ingredients/create", component: CreateIngredientPage, permission: "ingredients:create" },
    { path: "ingredients/:ingredientId/edit", component: EditIngredientPage, permission: "ingredients:edit" },

    { path: "packagings", component: PackagingListPage, permission: "packagings:view" },
    { path: "packaging-groups", component: PackagingGroupPage, permission: "packagingGroups:view" },
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

    { path: "juices", component: JuiceListPage, permission: "juices:view" },
    { path: "juices/create", component: JuiceEditorPage, permission: "juices:create" },
    { path: "juices/materials", component: JuiceMaterialsPage, permission: "juices:view" },
    { path: "juices/:juiceId", component: JuiceEditorPage, permission: "juices:view" },
    { path: "juices/:juiceId/edit", component: JuiceEditorPage, permission: "juices:edit" },
    { path: "juice-config", component: JuiceConfigPage, permission: "juiceConfig:edit" },

    { path: "products", component: ProductListPage, permission: "products:view" },
    { path: "products/create", component: CreateProductPage, permission: "products:create" },
    { path: "products/:productId/edit", component: EditProductPage, permission: "products:edit" },

    { path: "salespeople", component: SalespersonListPage, permission: "salespeople:view" },
    { path: "salespeople/create", component: CreateSalespersonPage, permission: "salespeople:create" },
    { path: "salespeople/:salespersonId/edit", component: EditSalespersonPage, permission: "salespeople:edit" },

    { path: "clients", component: ClientListPage, permission: "clients:view" },
    { path: "clients/create", component: CreateClientPage, permission: "clients:create" },
    { path: "clients/:clientId/edit", component: EditClientPage, permission: "clients:edit" },

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
        (route) => Array.isArray(route.permission) ? route.permission.some(hasPermission) : route.permission.endsWith(":view") && hasPermission(route.permission)
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
