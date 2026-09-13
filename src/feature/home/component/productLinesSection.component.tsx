import { useTranslation } from "react-i18next"
import { motion } from "motion/react"
import { SiteContainer } from "@/shared/component/siteContainer.component"
import { fadeUp, viewportOnce } from "@/shared/animation/motionVariants"
import { PRODUCT_LINES } from "@/feature/home/constant/productLines.constant"
import { ProductLineRow } from "@/feature/home/component/productLineRow.component"
import { ProductHighlightsCarousel } from "@/feature/home/component/productHighlightsCarousel.component"

export function ProductLinesSection() {
    const { t } = useTranslation()

    return (
        <section id="lineas" className="bg-crema py-24 sm:py-32">
            <SiteContainer>
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={viewportOnce}
                    className="mx-auto max-w-2xl text-center"
                >
                    <span className="font-mono text-xs uppercase tracking-[0.14em] text-dorado-hover">
                        {t("home.lines.eyebrow")}
                    </span>
                    <h2 className="mt-4 font-display text-3xl font-extrabold uppercase tracking-tight text-verde-profundo sm:text-4xl">
                        {t("home.lines.title")}
                    </h2>
                    <p className="mt-5 text-base leading-relaxed text-texto-suave sm:text-lg">{t("home.lines.subtitle")}</p>
                </motion.div>

                <div className="mt-20 flex flex-col gap-24 sm:mt-24 sm:gap-32">
                    {PRODUCT_LINES.map((line, index) => (
                        <ProductLineRow key={line.id} line={line} index={index} />
                    ))}
                </div>

                <div className="mt-24 sm:mt-28">
                    <h3 className="text-center font-display text-xl font-bold uppercase tracking-tight text-verde-profundo">
                        {t("home.lines.highlightsTitle")}
                    </h3>
                    <ProductHighlightsCarousel />
                </div>
            </SiteContainer>
        </section>
    )
}
