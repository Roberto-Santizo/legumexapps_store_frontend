import RawCountUp from "react-countup"
import { motion } from "motion/react"
import type { LucideIcon } from "lucide-react"
import { fadeUp } from "@/shared/animation/motionVariants"

// react-countup's CJS build confuses esbuild's default-export interop (its dev-bundled chunk
// ends up re-exporting the whole `{ default, useCountUp }` exports object as the default), so
// the plain `import CountUp from "react-countup"` sometimes resolves to that object instead of
// the component itself. Unwrap defensively so it works either way.
const CountUp = (RawCountUp as unknown as { default?: typeof RawCountUp }).default ?? RawCountUp

type StatItemProps = {
    icon: LucideIcon
    value: number
    suffix: string
    label: string
}

export function StatItem({ icon: Icon, value, suffix, label }: Readonly<StatItemProps>) {
    return (
        <motion.div
            variants={fadeUp}
            className="landing-stat-card flex min-h-60 min-w-0 flex-col items-center gap-4 rounded-panel border border-brand-300/40 bg-landing-cream p-6 text-center shadow-panel transition duration-300 hover:-translate-y-1 hover:border-brand-500 motion-reduce:hover:translate-y-0"
        >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-700">
                <Icon size={22} />
            </span>
            <span className="font-display text-[clamp(2rem,2.8vw,2.5rem)] font-bold leading-tight tracking-tight text-brand-900">
                <CountUp end={value} suffix={suffix} duration={2.4} autoAnimate autoAnimateOnce separator="," />
            </span>
            <span className="max-w-52 text-sm leading-relaxed text-ink-600">{label}</span>
        </motion.div>
    )
}
