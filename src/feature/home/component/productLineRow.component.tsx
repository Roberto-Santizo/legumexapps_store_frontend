import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { useTranslation } from "react-i18next"
import type { ProductLine } from "@/feature/home/constant/productLines.constant"
import { fadeUp, slideFromLeft, slideFromRight, staggerContainer, viewportOnce } from "@/shared/animation/motionVariants"
import { useSiteImages } from "@/feature/siteImage/hook/useSiteImages"

type ProductLineRowProps = {
    line: ProductLine
    index: number
}

export function ProductLineRow({ line, index }: Readonly<ProductLineRowProps>) {
    const { t } = useTranslation()
    const Icon = line.icon
    const isReversed = index % 2 === 1
    const siteImages = useSiteImages()
    const imageSrc = siteImages[line.slotKey] ?? line.image

    const imageRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({ target: imageRef, offset: ["start end", "end start"] })
    const imageY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"])

    const pills = t(`home.lines.items.${line.translationKey}.pills`, { returnObjects: true }) as string[]

    return (
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.div
                ref={imageRef}
                variants={isReversed ? slideFromRight : slideFromLeft}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
                whileHover={{ scale: 1.02, rotate: isReversed ? -0.6 : 0.6 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
                className={`relative h-72 overflow-hidden rounded-panel shadow-panel sm:h-120 ${
                    isReversed ? "lg:order-2" : ""
                }`}
            >
                <motion.img
                    src={imageSrc}
                    alt={t(`home.lines.items.${line.translationKey}.name`)}
                    style={{ y: imageY, scale: 1.18 }}
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-brand-900/50 via-transparent to-transparent" />
                <span className="absolute top-5 left-5 flex h-12 w-12 items-center justify-center rounded-full bg-canvas/95 text-ink-900 shadow-panel">
                    <Icon size={22} />
                </span>
            </motion.div>

            <motion.div
                variants={isReversed ? slideFromLeft : slideFromRight}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
                className={isReversed ? "lg:order-1" : ""}
            >
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-brand-700">
                    {t("home.lines.lineLabel", { number: index + 1 })}
                </span>
                <h3 className="mt-3 font-display text-3xl font-bold uppercase tracking-tight text-ink-900 sm:text-4xl">
                    {t(`home.lines.items.${line.translationKey}.name`)}
                </h3>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">
                    {t(`home.lines.items.${line.translationKey}.description`)}
                </p>

                <motion.div
                    variants={staggerContainer(0.06)}
                    initial="hidden"
                    whileInView="show"
                    viewport={viewportOnce}
                    className="mt-6 flex flex-wrap gap-2"
                >
                    {pills.map((pill, pillIndex) => (
                        <motion.span
                            // El nombre no alcanza como key: varias líneas repiten el mismo
                            // producto en más de una sub-categoría real del catálogo (ej.
                            // "Pineapple" aparece en fruta congelada y en pulpas).
                            key={`${pill}-${pillIndex}`}
                            variants={fadeUp}
                            whileHover={{ y: -2 }}
                            className="rounded-badge border border-brand-500/25 bg-brand-500/10 px-3 py-1.5 text-sm font-medium text-ink-900"
                        >
                            {pill}
                        </motion.span>
                    ))}
                </motion.div>
            </motion.div>
        </div>
    )
}
