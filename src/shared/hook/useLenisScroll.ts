import { useEffect } from "react"
import Lenis from "lenis"

let activeLenis: Lenis | null = null

export function useLenisScroll() {
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        if (prefersReducedMotion) return

        const lenis = new Lenis({
            duration: 1.1,
            smoothWheel: true,
        })
        activeLenis = lenis

        let rafId: number
        function raf(time: number) {
            lenis.raf(time)
            rafId = requestAnimationFrame(raf)
        }
        rafId = requestAnimationFrame(raf)

        return () => {
            cancelAnimationFrame(rafId)
            lenis.destroy()
            activeLenis = null
        }
    }, [])
}

export function scrollToHash(hash: string) {
    if (activeLenis) {
        activeLenis.scrollTo(hash, { offset: -72 })
        return
    }
    document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" })
}
