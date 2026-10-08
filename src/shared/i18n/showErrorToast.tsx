import { toast } from "sonner"
import { FrontendI18nError } from "./frontendI18nError"
import { TranslatedMessage } from "./translatedMessage.component"

export function showErrorToast(error: Error): void {
    if (error instanceof FrontendI18nError) toast.error(<TranslatedMessage translationKey={error.translationKey} />)
    else toast.error(error.message)
}
