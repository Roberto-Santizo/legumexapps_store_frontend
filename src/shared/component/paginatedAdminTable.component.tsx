import type { ReactNode } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Input } from "@/shared/component/input.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { PaginationComponent } from "@/shared/component/pagination.component"
import { usePaginatedSearch } from "@/shared/hook/usePaginatedSearch"

type PaginatedApiResponse<T> = {
    data: T[]
    meta: { totalPages: number }
}

type Column<T> = {
    key: string
    header: string
    render: (item: T) => ReactNode
}

type PaginatedAdminTableProps<T extends { id: number }> = {
    queryKey: readonly unknown[]
    queryFn: (params: { page: number; search: string }) => Promise<PaginatedApiResponse<T> | undefined>
    columns: Column<T>[]
    searchPlaceholder: string
    emptyMessage: string
    renderActions: (item: T) => ReactNode
}

export function PaginatedAdminTable<T extends { id: number }>({
    queryKey,
    queryFn,
    columns,
    searchPlaceholder,
    emptyMessage,
    renderActions,
}: Readonly<PaginatedAdminTableProps<T>>) {
    const { t } = useTranslation()
    const { page, setPage, searchInput, setSearchInput, debouncedSearch } = usePaginatedSearch()

    const itemsQuery = useQuery({
        queryKey: [...queryKey, page, debouncedSearch],
        queryFn: () => queryFn({ page, search: debouncedSearch }),
        placeholderData: keepPreviousData,
        retry: false,
    })

    if (itemsQuery.isLoading) return <p className="text-texto-suave">{t("common.loading")}</p>
    if (itemsQuery.isError) return <p className="text-error-fg">{t("common.loadError")}</p>

    const items = itemsQuery.data?.data ?? []
    const totalPages = itemsQuery.data?.meta.totalPages ?? 1

    return (
        <div>
            <Input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={searchPlaceholder}
                className="mb-4 max-w-sm"
            />

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <Th key={column.key}>{column.header}</Th>
                            ))}
                            <Th>{t("common.actions")}</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                {columns.map((column) => (
                                    <Td key={column.key}>{column.render(item)}</Td>
                                ))}
                                <Td>{renderActions(item)}</Td>
                            </TableRow>
                        ))}
                        {items.length === 0 && <TableEmpty message={emptyMessage} colSpan={columns.length + 1} />}
                    </TableBody>
                </Table>
                <PaginationComponent currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </TableContainer>
        </div>
    )
}
