import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import es from "./locales/es/translation.json"
import en from "./locales/en/translation.json"

// Also keep browser controls and assistive technology aligned with the active language.
i18next.on("languageChanged", language => {
    if (typeof document !== "undefined") document.documentElement.lang = language.startsWith("en") ? "en" : "es"
})

i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: "es",
        supportedLngs: ["es", "en"],
        resources: {
            es: { translation: es },
            en: { translation: en },
        },
        interpolation: {
            escapeValue: false,
        },
    })

export default i18next
