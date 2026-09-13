import type { Variants } from "motion/react"

// Variants reusables para los "reveal on scroll" del sitio público. Centralizados acá para que
// todas las secciones de la landing se sientan consistentes (mismo easing/duración) en vez de
// que cada componente invente los suyos.

export const EASE_OUT = [0.16, 1, 0.3, 1] as const

export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 32 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
}

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.8, ease: EASE_OUT } },
}

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.94 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: EASE_OUT } },
}

export const slideFromLeft: Variants = {
    hidden: { opacity: 0, x: -48 },
    show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE_OUT } },
}

export const slideFromRight: Variants = {
    hidden: { opacity: 0, x: 48 },
    show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE_OUT } },
}

export const staggerContainer = (staggerChildren = 0.12, delayChildren = 0): Variants => ({
    hidden: {},
    show: {
        transition: { staggerChildren, delayChildren },
    },
})

// Config estándar para whileInView: dispara una sola vez, un poco antes de que la sección
// termine de entrar en el viewport (se siente más ágil que esperar a que esté 100% visible).
export const viewportOnce = { once: true, margin: "-80px" } as const
