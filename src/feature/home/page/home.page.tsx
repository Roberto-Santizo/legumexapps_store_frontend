import { ArrowUpRight, BriefcaseBusiness, ChartNoAxesCombined } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { LegumexLogoStacked } from "@/shared/component/legumexLogoStacked.component"
import { LanguageSwitch } from "@/shared/layout/LanguageSwitch"

const accessOptions = [
    { key: "representative", href: "/iniciar-sesion", icon: BriefcaseBusiness },
    { key: "administrator", href: "/admin", icon: ChartNoAxesCombined },
] as const

const easeOut = [0.16, 1, 0.3, 1] as const

export function HomePage() {
    const { t } = useTranslation()
    const reduceMotion = useReducedMotion()

    return (
        <main className="relative isolate flex min-h-screen overflow-hidden bg-crema text-verde-profundo">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -left-52 top-1/3 size-[34rem] rounded-full bg-brand-300/15 blur-3xl" />
                <div className="absolute right-[38%] top-0 h-full w-px bg-gradient-to-b from-transparent via-verde-tinta/10 to-transparent" />
            </div>

            <div className="mx-auto flex min-h-screen w-full max-w-[90rem] flex-col px-5 sm:px-9 lg:px-14">
                <header className="relative z-20 -mx-5 flex items-center justify-between bg-transparent px-5 py-1 sm:-mx-9 sm:px-9 lg:-mx-14 lg:px-14">
                    <LegumexLogoStacked size="header" className="shrink-0" />
                    <LanguageSwitch />
                </header>

                <section className="-mt-5 grid flex-1 items-center gap-10 pb-10 pt-5 sm:-mt-6 sm:pb-14 lg:-mt-9 lg:grid-cols-[1fr_0.96fr] lg:gap-14 lg:py-8">
                    <motion.div
                        className="relative z-10 py-8 lg:py-14"
                        initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: easeOut }}
                    >
                        <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-brand-900/10 bg-hueso/80 px-4 py-2 shadow-sm shadow-brand-900/5">
                            <span className="relative flex size-2.5">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-500/40 motion-reduce:animate-none" />
                                <span className="relative inline-flex size-2.5 rounded-full bg-brand-700" />
                            </span>
                            <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-brand-700">
                                {t("access.eyebrow")}
                            </span>
                        </div>

                        <h1 className="max-w-3xl font-display text-[clamp(3.1rem,7vw,6.6rem)] font-semibold leading-[0.96] tracking-[-0.055em] text-verde-profundo">
                            <span className="block">{t("access.titleLineOne")}</span>
                            <span className="mt-2 block bg-gradient-to-r from-brand-700 via-brand-500 to-[#8dad5e] bg-clip-text text-transparent">
                                {t("access.titleLineTwo")}
                            </span>
                        </h1>

                        <p className="mt-7 max-w-lg text-base leading-7 text-texto-suave sm:text-lg sm:leading-8">
                            {t("access.description")}
                        </p>

                        <div className="mt-10 flex items-center gap-4 text-sm font-medium text-verde-tinta">
                            <span className="h-px w-12 bg-brand-500" />
                            <span>{t("access.choosePrompt")}</span>
                        </div>

                        <motion.div
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-4 right-8 hidden size-24 rounded-full border border-brand-700/15 lg:block"
                            animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                            transition={reduceMotion ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <span className="absolute inset-3 rounded-full border border-brand-500/20" />
                            <span className="absolute right-1 top-4 size-2 rounded-full bg-brand-500" />
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-900 via-[#07562e] to-brand-700 p-5 shadow-[0_32px_90px_-38px_rgba(4,78,39,0.65)] sm:rounded-[2.5rem] sm:p-8 lg:rounded-[4rem_1.25rem_1.25rem_4rem] lg:p-8 xl:rounded-[5rem_1.5rem_1.5rem_5rem] xl:p-10 2xl:p-12"
                        initial={reduceMotion ? false : { opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.75, delay: reduceMotion ? 0 : 0.1, ease: easeOut }}
                    >
                        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                            <div className="absolute -right-28 -top-36 size-[27rem] rounded-full border border-white/10" />
                            <div className="absolute -right-8 -top-16 size-[18rem] rounded-full border border-white/[0.07]" />
                            <div className="absolute -bottom-36 -left-28 size-[25rem] rounded-full bg-brand-500/15 blur-2xl" />
                            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-300/0 via-brand-300/50 to-brand-300/0 lg:hidden" />
                        </div>

                        <div className="relative mb-6 flex items-center justify-between px-1 sm:mb-8 sm:px-2 lg:mb-6 xl:mb-8">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                                {t("access.panelTitle")}
                            </span>
                            <span className="font-mono text-xs tracking-[0.16em] text-brand-300">01 / 02</span>
                        </div>

                        <div className="relative grid gap-3 sm:gap-4 lg:gap-3 xl:gap-4">
                            {accessOptions.map(({ key, href, icon: Icon }, index) => (
                                <Link
                                    key={key}
                                    to={href}
                                    className="group relative flex min-h-36 items-center gap-4 overflow-hidden rounded-2xl border border-white/70 bg-hueso px-4 py-5 shadow-[0_12px_35px_-24px_rgba(0,0,0,0.55)] transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-white hover:bg-white hover:shadow-[0_20px_44px_-24px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900 motion-reduce:transform-none motion-reduce:transition-none sm:min-h-36 sm:gap-5 sm:rounded-3xl sm:px-6 sm:py-6 lg:min-h-32 lg:gap-4 lg:px-5 lg:py-4 xl:min-h-36 xl:px-6 xl:py-5"
                                >
                                    <span className="absolute inset-y-0 left-0 w-1 origin-bottom scale-y-0 bg-brand-500 transition-transform duration-300 group-hover:scale-y-100 motion-reduce:transition-none" />
                                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-900 text-white shadow-md shadow-brand-900/15 transition duration-300 group-hover:scale-105 group-hover:bg-brand-700 motion-reduce:transition-none sm:size-14 lg:size-12 xl:size-14">
                                        <Icon size={23} strokeWidth={1.8} aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="mb-1 block font-mono text-[0.65rem] font-semibold tracking-[0.14em] text-brand-700/65">
                                            {t("access.optionCode", { number: String(index + 1).padStart(2, "0") })}
                                        </span>
                                        <span className="block font-display text-lg font-semibold leading-snug text-verde-profundo sm:text-xl">
                                            {t(`access.${key}.title`)}
                                        </span>
                                        <span className="mt-1 block max-w-sm text-sm leading-relaxed text-texto-suave">
                                            {t(`access.${key}.description`)}
                                        </span>
                                    </span>
                                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-300/30 text-brand-900 transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:scale-105 group-hover:bg-brand-300/50 motion-reduce:transition-none sm:size-12 lg:size-10 xl:size-12">
                                        <ArrowUpRight size={21} strokeWidth={2} aria-hidden="true" />
                                    </span>
                                </Link>
                            ))}
                        </div>

                        <div className="relative mt-6 flex items-center justify-between border-t border-white/15 px-1 pt-5 text-xs text-white/60 sm:mt-8 sm:px-2 sm:pt-6 lg:mt-6 lg:pt-4 xl:mt-8 xl:pt-6">
                            <span>{t("access.footer")}</span>
                        </div>
                    </motion.div>
                </section>

                <footer className="flex items-center justify-between gap-4 border-t border-brand-900/10 py-4 text-xs text-verde-tinta/70 sm:py-5">
                    <span>© {new Date().getFullYear()} Legumex</span>
                    <span className="font-medium">{t("access.location")}</span>
                </footer>
            </div>
        </main>
    )
}
