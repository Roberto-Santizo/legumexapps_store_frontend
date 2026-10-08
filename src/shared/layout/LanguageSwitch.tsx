import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { FlagEs, FlagUs } from "@sankyu/react-circle-flags"
import { useTranslation } from "react-i18next"

type LanguageCode = "es" | "en"

const LANGUAGES: { code: LanguageCode; labelKey: string; Flag: typeof FlagEs }[] = [
    { code: "es", labelKey: "common.languages.es", Flag: FlagEs },
    { code: "en", labelKey: "common.languages.en", Flag: FlagUs },
]

type LanguageSwitchTone = "light" | "dark"

type LanguageSwitchProps = {
    tone?: LanguageSwitchTone
}

const triggerToneClasses: Record<LanguageSwitchTone, string> = {
    light: "border-line bg-surface text-ink-900 hover:bg-canvas",
    dark: "border-canvas/25 bg-canvas/10 text-canvas hover:bg-canvas/15",
}

export function LanguageSwitch({ tone = "light" }: Readonly<LanguageSwitchProps>) {
    const { t, i18n } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const currentLanguage = i18n.language.startsWith("en") ? "en" : "es"
    const current = LANGUAGES.find((language) => language.code === currentLanguage) ?? LANGUAGES[0]

    useEffect(() => {
        if (!isOpen) return

        function handlePointerDown(event: PointerEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") setIsOpen(false)
        }

        document.addEventListener("pointerdown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen])

    function selectLanguage(code: LanguageCode) {
        i18n.changeLanguage(code)
        setIsOpen(false)
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-label={t("common.selectLanguage")}
                className={`flex h-control items-center gap-2 rounded-action border pl-1.5 pr-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${triggerToneClasses[tone]}`}
            >
                <current.Flag width={22} height={22} aria-hidden="true" />
                <span>{current.code.toUpperCase()}</span>
                <ChevronDown size={14} aria-hidden="true" className={`transition ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-44 rounded-panel border border-line bg-surface p-1.5 shadow-panel"
                >
                    {LANGUAGES.map(({ code, labelKey, Flag }) => (
                        <button
                            key={code}
                            type="button"
                            role="menuitemradio"
                            aria-checked={currentLanguage === code}
                            onClick={() => selectLanguage(code)}
                            className={`flex w-full items-center gap-3 rounded-control px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                                currentLanguage === code
                                    ? "bg-canvas text-ink-900"
                                    : "text-ink-600 hover:bg-canvas/60 hover:text-ink-900"
                            }`}
                        >
                            <Flag width={22} height={22} aria-hidden="true" />
                            {t(labelKey)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
