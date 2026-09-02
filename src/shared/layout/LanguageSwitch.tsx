import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { FlagEs, FlagUs } from "@sankyu/react-circle-flags"
import { useTranslation } from "react-i18next"

type LanguageCode = "es" | "en"

const LANGUAGES: { code: LanguageCode; label: string; Flag: typeof FlagEs }[] = [
    { code: "es", label: "Español", Flag: FlagEs },
    { code: "en", label: "English", Flag: FlagUs },
]

type LanguageSwitchTone = "light" | "dark"

type LanguageSwitchProps = {
    tone?: LanguageSwitchTone
}

const triggerToneClasses: Record<LanguageSwitchTone, string> = {
    light: "border-gris-campo bg-hueso text-verde-profundo hover:bg-crema",
    dark: "border-crema/25 bg-crema/10 text-crema hover:bg-crema/15",
}

export function LanguageSwitch({ tone = "light" }: Readonly<LanguageSwitchProps>) {
    const { i18n } = useTranslation()
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
                className={`flex h-10 items-center gap-2 rounded-full border pl-1.5 pr-3 text-sm font-medium transition ${triggerToneClasses[tone]}`}
            >
                <current.Flag width={22} height={22} />
                <span>{current.code.toUpperCase()}</span>
                <ChevronDown size={14} className={`transition ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-44 rounded-2xl border border-gris-campo bg-hueso p-1.5 shadow-card-hover"
                >
                    {LANGUAGES.map(({ code, label, Flag }) => (
                        <button
                            key={code}
                            type="button"
                            role="menuitemradio"
                            aria-checked={currentLanguage === code}
                            onClick={() => selectLanguage(code)}
                            className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition ${
                                currentLanguage === code
                                    ? "bg-crema text-verde-profundo"
                                    : "text-texto-suave hover:bg-crema/60 hover:text-verde-profundo"
                            }`}
                        >
                            <Flag width={22} height={22} />
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
