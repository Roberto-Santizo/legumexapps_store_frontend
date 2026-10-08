// Cell contents shared by the admin follow-up tables (custom quotes, unfinished quotes).

type SalespersonSummaryProps = {
    salesperson: { name: string; email: string } | null | undefined
}

// The rep who requested the quote; "—" when the account no longer exists.
export function SalespersonSummary({ salesperson }: Readonly<SalespersonSummaryProps>) {
    if (!salesperson) return <>—</>

    return (
        <>
            <p className="font-medium">{salesperson.name}</p>
            <p className="text-xs text-ink-600">{salesperson.email}</p>
        </>
    )
}

type ProductSummaryProps = {
    productDisplayName: string
    variantLabel: string | null | undefined
}

export function ProductSummary({ productDisplayName, variantLabel }: Readonly<ProductSummaryProps>) {
    return (
        <>
            <p className="font-medium">{productDisplayName}</p>
            {variantLabel && <p className="text-xs text-ink-600">{variantLabel}</p>}
        </>
    )
}
