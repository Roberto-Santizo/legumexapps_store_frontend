// Recharts pinta con SVG `fill`/`stroke`, que no siempre resuelve `var(--token)` de forma
// confiable entre navegadores -- por eso estos valores son hex planos, copiados a mano de los
// tokens de `index.css` (mismo patrón de "catálogo espejado a mano" que unitCatalog.ts: si cambia
// un color de marca ahí, hay que actualizarlo aquí también).
//
// Acentos de una sola serie: cada gráfica de barras del dashboard grafica una sola métrica, así
// que un acento de marca fijo por gráfica alcanza -- no requiere pasar el validador de paleta
// categórica (ese validador solo aplica cuando dos o más series conviven en la misma gráfica).
export const CHART_ACCENT_TREND = "#e9b93c" // --color-dorado
export const CHART_ACCENT_PRODUCTS = "#1c4430" // --color-verde-tinta
export const CHART_ACCENT_CUSTOMERS = "#a8c544" // --color-brote
export const CHART_ACCENT_INGREDIENTS = "#0f2e1e" // --color-verde-profundo

// Paleta categórica para el único gráfico con varias series a la vez (pastel de participación
// de ingresos por producto). Los acentos de marca de arriba NO pasan el validador de paleta
// categórica del skill de dataviz cuando se combinan entre sí (verde-tinta/verde-profundo quedan
// fuera de la banda de luminancia y dorado/brote se confunden bajo protanopia/deuteranopia) --
// se usan en su lugar los primeros 4 slots de la paleta de referencia validada del skill
// (references/palette.md), confirmados aquí con
// `node scripts/validate_palette.js "#2a78d6,#eb6834,#1baf7a,#eda100,#898781" --mode light --surface "#fffdf8"`.
// El 5to color (gris) es intencionalmente de croma bajo -- es el cubo "Otros", no una categoría
// real, así que "lee como gris" es el resultado esperado, no una falla.
export const CHART_CATEGORICAL_PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"]
export const CHART_OTHER_COLOR = "#898781"

// Cromática del propio gráfico (ejes/gridlines/texto) -- tomada de los tokens ya existentes en
// index.css (gris-campo/texto-suave), no de la paleta de referencia del skill, para que las
// gráficas convivan visualmente con el resto de la UI del admin.
export const CHART_GRID_COLOR = "#e3e0d5" // --color-gris-campo
export const CHART_AXIS_TEXT_COLOR = "#5a6154" // --color-texto-suave
export const CHART_TOOLTIP_BG = "#0f2e1e" // --color-verde-profundo
export const CHART_TOOLTIP_TEXT = "#fffdf8" // --color-hueso
