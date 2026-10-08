import { useTranslation } from "react-i18next"

// Keep notifications reactive while they remain visible after a language change.
export function TranslatedMessage({ translationKey }: Readonly<{ translationKey: string }>) {
    const { t } = useTranslation()
    return <>{t(translationKey)}</>
}
