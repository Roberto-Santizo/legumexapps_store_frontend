// Layout responsive del wizard, compartido por el cotizador del representante y el del admin.
//
// Móvil: el margen negativo le quita 8px de gutter a cada lado para que la tarjeta se sienta amplia.
// Desde `sm` se centra y crece por breakpoints (2xl -> 4xl -> 6xl).
export const WIZARD_STEP_LAYOUT_CLASSNAME = "-mx-2 space-y-6 sm:mx-auto sm:max-w-2xl md:max-w-4xl xl:max-w-6xl"

// Paso "total": formulario + resultado. Una columna hasta `lg`, dos columnas desde ahí.
export const WIZARD_DETAILS_LAYOUT_CLASSNAME = "-mx-2 grid grid-cols-1 items-start gap-6 sm:mx-0 lg:grid-cols-2 lg:gap-8"
