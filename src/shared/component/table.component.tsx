import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react"

export function TableContainer({ className = "", ...props }: Readonly<HTMLAttributes<HTMLDivElement>>) {
    return <div className={`overflow-x-auto rounded-card bg-hueso shadow-card ${className}`} {...props} />
}

export function Table({ className = "", ...props }: Readonly<HTMLAttributes<HTMLTableElement>>) {
    return <table className={`w-full min-w-max border-collapse text-left text-sm ${className}`} {...props} />
}

export function TableHead({ className = "", ...props }: Readonly<HTMLAttributes<HTMLTableSectionElement>>) {
    return <thead className={`border-b border-gris-campo ${className}`} {...props} />
}

export function TableBody({ className = "", ...props }: Readonly<HTMLAttributes<HTMLTableSectionElement>>) {
    return <tbody className={className} {...props} />
}

export function TableRow({ className = "", ...props }: Readonly<HTMLAttributes<HTMLTableRowElement>>) {
    return <tr className={`border-b border-gris-campo last:border-0 hover:bg-crema/60 ${className}`} {...props} />
}

export function Th({ className = "", ...props }: Readonly<ThHTMLAttributes<HTMLTableCellElement>>) {
    return (
        <th
            className={`whitespace-nowrap px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-texto-suave sm:px-4 sm:py-3 ${className}`}
            {...props}
        />
    )
}

export function Td({ className = "", ...props }: Readonly<TdHTMLAttributes<HTMLTableCellElement>>) {
    return <td className={`whitespace-nowrap px-3 py-2.5 text-verde-profundo sm:px-4 sm:py-3 ${className}`} {...props} />
}

export function TableEmpty({ message, colSpan }: Readonly<{ message: string; colSpan: number }>) {
    return (
        <tr>
            <td colSpan={colSpan} className="px-4 py-8 text-center text-texto-suave">
                {message}
            </td>
        </tr>
    )
}
