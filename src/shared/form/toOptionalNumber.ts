export function toOptionalNumber(value: string): number | undefined {
    return value === "" ? undefined : Number(value)
}
