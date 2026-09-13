import { useTranslation } from "react-i18next"
import { Leaf } from "lucide-react"

// Tira de movimiento continuo entre secciones. El array de frases se duplica una sola vez para
// que la animación CSS (.animate-marquee, ver index.css) pueda hacer un loop sin salto visible.
export function MarqueeStrip() {
    const { t } = useTranslation()
    const phrases = t("home.marquee.items", { returnObjects: true }) as string[]
    const loopPhrases = [...phrases, ...phrases]

    return (
        <div className="overflow-hidden border-y border-crema/10 bg-verde-tinta py-5">
            <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap">
                {loopPhrases.map((phrase, index) => (
                    <span key={`${phrase}-${index}`} className="flex items-center gap-10">
                        <span className="font-display text-lg font-bold tracking-wide text-crema uppercase sm:text-xl">
                            {phrase}
                        </span>
                        <Leaf size={16} className="text-dorado" />
                    </span>
                ))}
            </div>
        </div>
    )
}
