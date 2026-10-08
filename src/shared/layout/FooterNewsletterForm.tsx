import { TranslatedMessage } from "@/shared/i18n/translatedMessage.component"
import { useState } from "react"
import type { SubmitEvent } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { Send } from "lucide-react"
import { Input } from "@/shared/component/input.component"

export function FooterNewsletterForm() {
    const { t } = useTranslation()
    const [emailAddress, setEmailAddress] = useState("")

    function handleSubscribe(event: SubmitEvent) {
        event.preventDefault()
        if (!emailAddress) return

        toast.success(<TranslatedMessage translationKey="site.footer.newsletter.success" />)
        setEmailAddress("")
    }

    return (
        <form onSubmit={handleSubscribe} className="flex w-full max-w-sm gap-2">
            <Input
                type="email"
                required
                value={emailAddress}
                onChange={(event) => setEmailAddress(event.target.value)}
                placeholder={t("site.footer.newsletter.placeholder")}
                aria-label={t("site.footer.newsletter.placeholder")}
                className="h-11"
            />
            <button
                type="submit"
                aria-label={t("site.footer.newsletter.submit")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-action bg-action-primary text-action-primary-text transition-colors hover:bg-action-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
                <Send size={18} />
            </button>
        </form>
    )
}
