export function toOptionalString(value: string): string | undefined {
    return value === "" ? undefined : value
}
