import { useEffect, useState } from "react"

const SEARCH_DEBOUNCE_MS = 400

// Estado compartido por todas las tablas paginadas: página actual + búsqueda con debounce que
// resetea la página a 1 cuando el término cambia (si no, se puede quedar en una página que ya no
// existe para el nuevo resultado filtrado). Ver pagination.component.tsx para el paginador que
// consume `page`/`setPage`, y cada *Table.component.tsx para el patrón de uso completo.
export function usePaginatedSearch() {
    const [page, setPage] = useState(1)
    const [searchInput, setSearchInput] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput)
            setPage(1)
        }, SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(timer)
    }, [searchInput])

    return { page, setPage, searchInput, setSearchInput, debouncedSearch }
}
