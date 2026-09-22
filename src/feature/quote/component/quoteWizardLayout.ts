// Layout responsive del wizard de cotización -- compartido por el flujo del representante
// (quoteRequest.page.tsx) y el cotizador interno del admin (adminQuoteCalculator.page.tsx), que
// usan el mismo QuoteCalculatorForm y deben verse igual.
//
// IMPORTANTE: ambas páginas renderizan el form como primer hijo de un <div> en dos ramas distintas
// (paso de detalles vs. el resto). React solo conserva el estado del wizard entre ramas si el
// elemento raíz de cada una es del mismo tipo en la misma posición -- por eso son dos constantes
// de clases sobre el mismo <div>, no dos componentes/wrappers distintos.
//
// Móvil: el margen negativo le quita 8px de gutter a cada lado de la página para que la tarjeta
// se sienta amplia en pantallas chicas. Desde `sm` se centra y crece por breakpoints (2xl -> 4xl ->
// 6xl) en vez de quedarse en una caja fija de 768px con espacio vacío a los lados.
export const WIZARD_STEP_LAYOUT_CLASSNAME = "-mx-2 space-y-6 sm:mx-auto sm:max-w-2xl md:max-w-4xl xl:max-w-6xl"

// Paso de detalles: formulario + resultado. Una columna hasta `lg`, dos columnas desde ahí.
export const WIZARD_DETAILS_LAYOUT_CLASSNAME = "-mx-2 grid grid-cols-1 items-start gap-6 sm:mx-0 lg:grid-cols-2 lg:gap-8"
