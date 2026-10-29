// Espejo de backend pricing/services/quoteProfit.ts (MAX_PROFIT_PER_POUND y 4 decimales). Solo para
// avisar antes de enviar: el backend vuelve a validar y es quien decide.
export const MAX_PROFIT_PER_POUND = 5
const PROFIT_PER_POUND_PATTERN = /^\d+(\.\d{1,4})?$/

export function isValidProfitPerPound(value: string): boolean {
    return PROFIT_PER_POUND_PATTERN.test(value) && Number(value) <= MAX_PROFIT_PER_POUND
}
