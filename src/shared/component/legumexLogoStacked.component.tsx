import { useTranslation } from "react-i18next"

type LegumexLogoStackedProps = {
    showTagline?: boolean
    className?: string
}

// Versión apilada y dibujada del logo Legumex (montañas + campos, AGROINDUSTRIA, LEGUMEX, hoja y lema), fiel al PNG
// original. Todos los colores son variables CSS (index.css, .legumex-stacked-logo) con valores propios para modo claro
// y oscuro, así se lee bien sobre cualquier fondo sin una imagen con fondo blanco.
export function LegumexLogoStacked({ showTagline = true, className = "" }: Readonly<LegumexLogoStackedProps>) {
    const { t } = useTranslation()
    return (
        <span role="img" aria-label={t("common.logoAlt")} className={`legumex-stacked-logo ${className}`}>
            <svg className="legumex-stacked-logo-mark" viewBox="40 54 222 84" aria-hidden="true" focusable="false">
                <path className="legumex-stacked-logo-peak" d="M44 128 C78 101 104 80 130 58 C150 72 169 86 188 100 L181 104 C163 93 147 83 130 71 C106 92 80 111 44 128 Z" />
                <path className="legumex-stacked-logo-peak" d="M174 106 C185 97 196 88 207 79 C224 93 241 108 259 128 C240 114 224 102 207 91 C197 98 187 103 174 106 Z" />
                <path className="legumex-stacked-logo-field" d="M56 130 C92 111 140 99 188 110 C142 106 98 117 56 130 Z" />
                <path className="legumex-stacked-logo-leaf" d="M98 133 C140 115 202 110 252 124 C203 119 146 124 98 133 Z" />
                <path className="legumex-stacked-logo-line" d="M126 136 C165 129 208 127 244 130" />
            </svg>
            <span className="legumex-stacked-logo-eyebrow">Agroindustria</span>
            <span className="legumex-stacked-logo-name">Legumex</span>
            {showTagline && <>
                <span className="legumex-stacked-logo-divider" aria-hidden="true">
                    <svg viewBox="0 0 12 12" focusable="false"><path d="M2 10 C2 5 5 2 10 2 C10 7 7 10 2 10 Z M2 10 L7 5" /></svg>
                </span>
                <span className="legumex-stacked-logo-tagline">Growing Quality. Delivering Trust.</span>
            </>}
        </span>
    )
}
