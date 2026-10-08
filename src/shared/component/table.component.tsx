import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react"

export function TableContainer({ className = "", ...props }: Readonly<HTMLAttributes<HTMLDivElement>>) {
    return <div className={`overflow-x-auto rounded-panel border border-line bg-surface shadow-panel ${className}`} {...props} />
}

export function Table({ className = "", ...props }: Readonly<HTMLAttributes<HTMLTableElement>>) {
    return <table className={`w-full min-w-max border-collapse text-left text-sm tabular-nums ${className}`} {...props} />
}

export function TableHead({ className = "", ...props }: Readonly<HTMLAttributes<HTMLTableSectionElement>>) {
    return <thead className={`border-b border-line bg-canvas ${className}`} {...props} />
}

export function TableBody({ className = "", ...props }: Readonly<HTMLAttributes<HTMLTableSectionElement>>) {
    return <tbody className={className} {...props} />
}

export function TableRow({ className = "", ...props }: Readonly<HTMLAttributes<HTMLTableRowElement>>) {
    return <tr className={`border-b border-line last:border-0 transition-colors hover:bg-canvas ${className}`} {...props} />
}

export function Th({ className = "", ...props }: Readonly<ThHTMLAttributes<HTMLTableCellElement>>) {
    return (
        <th
            className={`whitespace-nowrap px-3 py-3 text-xs font-medium uppercase tracking-wide text-ink-600 sm:px-4 sm:py-4 ${className}`}
            {...props}
        />
    )
}

export function Td({ className = "", ...props }: Readonly<TdHTMLAttributes<HTMLTableCellElement>>) {
    return <td className={`whitespace-nowrap px-3 py-3 text-ink-900 sm:px-4 sm:py-4 ${className}`} {...props} />
}

export function TableEmpty({ message, colSpan }: Readonly<{ message: string; colSpan: number }>) {
    return (
        <tr>
            <td colSpan={colSpan} className="px-4 py-8 text-center text-ink-600">
                {message}
            </td>
        </tr>
    )
}
