import { useEffect, useState } from "react"

const SEARCH_DEBOUNCE_MS = 400

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
