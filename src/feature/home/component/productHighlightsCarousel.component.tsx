import { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { PRODUCT_LINES } from "@/feature/home/constant/productLines.constant"
import { fadeUp, viewportOnce } from "@/shared/animation/motionVariants"
import { useSiteImages } from "@/feature/siteImage/hook/useSiteImages"

// Carrusel secundario de alto perfil (nunca miniaturas) con auto-play, para dar movimiento extra
// entre las filas grandes de líneas de producto. Se pausa al interactuar y respeta
// prefers-reduced-motion (embla-carousel-autoplay ya honra esa preferencia por defecto vía CSS,
// pero además chequeamos acá para no ni siquiera registrar el plugin).
export function ProductHighlightsCarousel() {
    const { t } = useTranslation()
    const siteImages = useSiteImages()
    const prefersReducedMotion =
        typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center", skipSnaps: false }, [
        ...(prefersReducedMotion ? [] : [Autoplay({ delay: 3800, stopOnInteraction: false })]),
    ])

    const [selectedIndex, setSelectedIndex] = useState(0)

    const onSelect = useCallback(() => {
        if (!emblaApi) return
        setSelectedIndex(emblaApi.selectedScrollSnap())
    }, [emblaApi])

    useEffect(() => {
        if (!emblaApi) return
        onSelect()
        emblaApi.on("select", onSelect)
        return () => {
            emblaApi.off("select", onSelect)
        }
    }, [emblaApi, onSelect])

    return (
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce} className="mt-8">
            <div ref={emblaRef} className="overflow-hidden">
                <div className="-ml-4 flex sm:-ml-6">
                    {PRODUCT_LINES.map((line) => (
                        <div key={line.id} className="min-w-0 flex-[0_0_78%] pl-4 sm:flex-[0_0_46%] sm:pl-6 lg:flex-[0_0_32%]">
                            <div className="relative h-72 overflow-hidden rounded-card shadow-card sm:h-80">
                                <img
                                    src={siteImages[line.slotKey] ?? line.image}
                                    alt={t(`home.lines.items.${line.translationKey}.name`)}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-verde-profundo/70 via-verde-profundo/10 to-transparent" />
                                <span className="absolute bottom-4 left-4 font-display text-lg font-bold uppercase tracking-tight text-crema">
                                    {t(`home.lines.items.${line.translationKey}.name`)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-5 flex justify-center gap-2">
                {PRODUCT_LINES.map((line, index) => (
                    <button
                        key={line.id}
                        type="button"
                        aria-label={t(`home.lines.items.${line.translationKey}.name`)}
                        onClick={() => emblaApi?.scrollTo(index)}
                        className={`h-2 rounded-full transition-all ${
                            index === selectedIndex ? "w-6 bg-dorado" : "w-2 bg-gris-campo"
                        }`}
                    />
                ))}
            </div>
        </motion.div>
    )
}
