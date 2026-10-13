type LegumexLogoTone = "brand" | "light"
type LegumexLogoSize = "sm" | "md" | "lg"

type LegumexLogoProps = {
    tone?: LegumexLogoTone
    size?: LegumexLogoSize
    showEyebrow?: boolean
    className?: string
}

// Drawn version of the Legumex mark (two outlined peaks over two leaf-shaped field swooshes). Every color is a CSS
// variable set by the tone class in index.css, so the logo can recolor and animate without an image.
export function LegumexLogo({ tone = "brand", size = "md", showEyebrow = true, className = "" }: Readonly<LegumexLogoProps>) {
    return (
        <span className={`legumex-logo legumex-logo--${tone} legumex-logo--${size} ${className}`}>
            <svg className="legumex-logo-mark" viewBox="110 212 1030 368" aria-hidden="true" focusable="false">
                <path className="legumex-logo-peak" d="M115 522 L560 218 L940 478 L566 300 Z" />
                <path className="legumex-logo-peak-back" d="M780 390 L882 318 L1135 516 L882 380 L828 424 Z" />
                <path className="legumex-logo-field" d="M175 556 C350 500 560 418 760 472 C560 476 380 520 175 556 Z" />
                <path className="legumex-logo-leaf" d="M462 572 C620 490 900 452 1092 558 C900 518 640 528 462 572 Z" />
            </svg>
            <span className="legumex-logo-wordmark">
                {showEyebrow && <span className="legumex-logo-eyebrow">Agroindustria</span>}
                <span className="legumex-logo-name">Legumex</span>
            </span>
        </span>
    )
}
