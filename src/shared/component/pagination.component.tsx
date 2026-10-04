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
        <div className="flex flex-col items-center justify-between gap-4 border-t border-line px-4 py-4 sm:flex-row">
            <div className="order-2 flex items-center gap-2 text-sm sm:order-1">
                <span className="font-medium text-ink-600">{t("common.pagination.page")}</span>
                <div className="flex h-control items-center gap-1.5 rounded-action border border-focus/40 bg-canvas px-3 py-1.5">
                    <span className="font-bold text-ink-900">{currentPage}</span>
                    <span className="font-medium text-ink-600">{t("common.pagination.of")}</span>
                    <span className="font-bold text-ink-900">{totalPages}</span>
                </div>
            </div>

            <div className="order-1 flex items-center gap-2 sm:order-2">
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex h-control items-center gap-1.5 rounded-action border border-focus px-4 py-2 text-sm font-semibold text-focus bg-surface transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface hover:bg-canvas hover:text-focus disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-600"
                >
                    <ChevronLeft size={16} strokeWidth={2.5} />
                    <span className="hidden sm:inline">{t("common.pagination.previous")}</span>
                </button>

                <div className="flex items-center gap-1.5">
                    {pages.map((page, index) =>
                        page === "..." ? (
                            <span key={`ellipsis-after-${pages[index - 1]}`} className="select-none px-1 font-bold text-ink-600">
                                •••
                            </span>
                        ) : (
                            <button
                                type="button"
                                key={page}
                                onClick={() => onPageChange(page)}
                                aria-current={currentPage === page ? "page" : undefined}
                                className={`h-10 min-w-10 rounded-action text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                                    currentPage === page
                                        ? "bg-action-primary text-action-primary-text"
                                        : "border border-line bg-surface text-ink-900 hover:border-focus"
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
                    className="flex h-control items-center gap-1.5 rounded-action border border-focus px-4 py-2 text-sm font-semibold text-focus bg-surface transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface hover:bg-canvas hover:text-focus disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-600"
                >
                    <span className="hidden sm:inline">{t("common.pagination.next")}</span>
                    <ChevronRight size={16} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    )
}
