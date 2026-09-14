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
            className="flex flex-col items-center gap-3 rounded-card border border-crema/10 bg-crema/5 p-6 text-center backdrop-blur-sm"
        >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-dorado/15 text-dorado">
                <Icon size={22} />
            </span>
            <span className="font-display text-4xl font-extrabold text-crema sm:text-5xl">
                <CountUp end={value} suffix={suffix} duration={2.4} autoAnimate autoAnimateOnce separator="," />
            </span>
            <span className="max-w-48 text-sm leading-snug text-crema/70">{label}</span>
        </motion.div>
    )
}
