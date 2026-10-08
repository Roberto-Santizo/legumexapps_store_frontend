// Only errors created by the frontend carry a translation key. API messages remain literal.
export class FrontendI18nError extends Error {
    readonly translationKey: string

    constructor(translationKey: string, resolveMessage: () => string) {
        super()
        this.translationKey = translationKey
        this.name = "FrontendI18nError"
        Object.defineProperty(this, "message", { configurable: true, get: resolveMessage })
    }
}
