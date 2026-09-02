import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

type PaginationProps = {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

const MAX_VISIBLE_PAGES = 7

function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
    if (totalPages <= MAX_VISIBLE_PAGES) {
        return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, "...", totalPages]
    }
    if (currentPage >= totalPages - 3) {
        return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages]
}

export function PaginationComponent({ currentPage, totalPages, onPageChange }: Readonly<PaginationProps>) {
    const { t } = useTranslation()

    if (totalPages < 1) return null

    const pages = getPageNumbers(currentPage, totalPages)

    return (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gris-campo px-4 py-4 sm:flex-row">
            <div className="order-2 flex items-center gap-2 text-sm sm:order-1">
                <span className="font-medium text-texto-suave">{t("common.pagination.page")}</span>
                <div className="flex items-center gap-1.5 rounded-chip border border-dorado/40 bg-crema px-3 py-1.5">
                    <span className="font-bold text-verde-profundo">{currentPage}</span>
                    <span className="font-medium text-texto-suave">{t("common.pagination.of")}</span>
                    <span className="font-bold text-verde-profundo">{totalPages}</span>
                </div>
            </div>

            <div className="order-1 flex items-center gap-2 sm:order-2">
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1.5 rounded-btn border-[1.5px] border-verde-profundo px-4 py-2 text-sm font-semibold text-verde-profundo transition hover:bg-verde-profundo hover:text-crema disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-verde-profundo"
                >
                    <ChevronLeft size={16} strokeWidth={2.5} />
                    <span className="hidden sm:inline">{t("common.pagination.previous")}</span>
                </button>

                <div className="flex items-center gap-1.5">
                    {pages.map((page, index) =>
                        page === "..." ? (
                            <span key={`ellipsis-after-${pages[index - 1]}`} className="select-none px-1 font-bold text-texto-suave">
                                •••
                            </span>
                        ) : (
                            <button
                                type="button"
                                key={page}
                                onClick={() => onPageChange(page)}
                                aria-current={currentPage === page ? "page" : undefined}
                                className={`h-9 min-w-9 rounded-chip text-sm font-bold transition ${
                                    currentPage === page
                                        ? "bg-dorado text-verde-profundo shadow-solid"
                                        : "border-[1.5px] border-gris-campo bg-hueso text-verde-profundo hover:border-dorado"
                                }`}
                            >
                                {page}
                            </button>
                        )
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1.5 rounded-btn border-[1.5px] border-verde-profundo px-4 py-2 text-sm font-semibold text-verde-profundo transition hover:bg-verde-profundo hover:text-crema disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-verde-profundo"
                >
                    <span className="hidden sm:inline">{t("common.pagination.next")}</span>
                    <ChevronRight size={16} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    )
}
