import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getRolesPaginatedAPI } from "@/feature/role/api/role.api"
import { usePermission } from "@/shared/auth/usePermission"
import { Input } from "@/shared/component/input.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { PaginationComponent } from "@/shared/component/pagination.component"
import { usePaginatedSearch } from "@/shared/hook/usePaginatedSearch"

export function RoleTable() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const { page, setPage, searchInput, setSearchInput, debouncedSearch } = usePaginatedSearch()

    const rolesQuery = useQuery({
        queryKey: ["roles", "paginated", page, debouncedSearch],
        queryFn: () => getRolesPaginatedAPI({ page, search: debouncedSearch }),
        placeholderData: keepPreviousData,
        retry: false,
    })

    if (rolesQuery.isLoading) return <p className="text-texto-suave">{t("common.loading")}</p>
    if (rolesQuery.isError) return <p className="text-error-fg">{t("common.loadError")}</p>

    const roles = rolesQuery.data?.data ?? []
    const totalPages = rolesQuery.data?.meta.totalPages ?? 1

    return (
        <div>
            <Input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t("role.table.searchPlaceholder")}
                className="mb-4 max-w-sm"
            />

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <Th>{t("role.form.name")}</Th>
                            <Th>{t("common.actions")}</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {roles.map((role) => (
                            <TableRow key={role.id}>
                                <Td>{role.name}</Td>
                                <Td>
                                    {hasPermission("roles:edit") && (
                                        <Link
                                            to={`/admin/roles/${role.id}/edit`}
                                            className="font-medium text-verde-profundo underline decoration-dorado underline-offset-4 hover:text-verde-tinta"
                                        >
                                            {t("common.edit")}
                                        </Link>
                                    )}
                                </Td>
                            </TableRow>
                        ))}
                        {roles.length === 0 && <TableEmpty message={t("role.table.empty")} colSpan={2} />}
                    </TableBody>
                </Table>
                <PaginationComponent currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </TableContainer>
        </div>
    )
}
