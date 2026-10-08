import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Pause, Play, Leaf } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PRODUCT_LINES } from "../constant/productLines.constant"
import { useSiteImages } from "@/feature/siteImage/hook/useSiteImages"

const products = PRODUCT_LINES.filter(line => ["fresh", "frozen", "hpp", "healthySnacks"].includes(line.id))
const positions = [
    { x: "-76%", y: "19%", scale: 0.66, opacity: 0.8, rotate: -7 },
    { x: "0%", y: "0%", scale: 1, opacity: 1, rotate: -2 },
    { x: "76%", y: "-16%", scale: 0.64, opacity: 0.85, rotate: 7 },
]

function showcaseZIndex(offset: number): number {
    if (offset === 0) return 3
    if (offset === 1) return 2
    return 1
}

export function HeroProductShowcase() {
    const { t } = useTranslation()
    const images = useSiteImages()
    const reducedMotion = useReducedMotion()
    const [current, setCurrent] = useState(0)
    const [paused, setPaused] = useState(false)
    const container = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (reducedMotion || paused) return
        let visible = false
        const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
        if (container.current) observer.observe(container.current)
        const timer = window.setInterval(() => {
            if (visible && !document.hidden) setCurrent(index => (index + 1) % products.length)
        }, 5000)
        return () => { observer.disconnect(); window.clearInterval(timer) }
    }, [reducedMotion, paused])

    return <div ref={container} className="landing-product-showcase">
        <div aria-hidden="true" className="landing-showcase-orbit" />
        <div className="landing-showcase-stage" aria-hidden="true">
            <AnimatePresence initial={false}>
                {[-1, 0, 1].map((offset, slot) => {
                    const product = products[(current + offset + products.length) % products.length]
                    const src = (product.id === "fresh" ? images.hero : undefined) ?? images[product.slotKey] ?? product.image
                    return <motion.img key={product.id} src={src} alt="" width={1000} height={1100}
                        loading="eager" fetchPriority={offset === 0 ? "high" : "auto"} decoding="async"
                        className={`landing-showcase-image landing-showcase-image-${product.id}`}
                        style={{ zIndex: showcaseZIndex(offset) }}
                        initial={reducedMotion ? false : { x: "140%", y: "-20%", scale: 0.6, opacity: 0, rotate: 9 }}
                        animate={positions[slot]}
                        exit={{ x: "-140%", y: "25%", scale: 0.6, opacity: 0, rotate: -9 }}
                        transition={{ duration: reducedMotion ? 0 : 1.05, ease: [0.22, 1, 0.36, 1] }} />
                })}
            </AnimatePresence>
        </div>
        <span className="landing-showcase-leaf" aria-hidden="true"><Leaf size={28} strokeWidth={1.4} /></span>
        {!reducedMotion && <button type="button" onClick={() => setPaused(value => !value)}
            aria-label={t(paused ? "home.hero.showcaseResume" : "home.hero.showcasePause")}
            className="landing-showcase-pause rounded-action text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>}
    </div>
}
