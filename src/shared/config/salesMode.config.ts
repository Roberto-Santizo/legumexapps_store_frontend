type SalesMode = "b2b" | "b2c"

const DEFAULT_SALES_MODE: SalesMode = "b2b"

function getSalesMode(): SalesMode {
    return import.meta.env.VITE_SALES_MODE === "b2c" ? "b2c" : DEFAULT_SALES_MODE
}

export function isB2cMode(): boolean {
    return getSalesMode() === "b2c"
}
