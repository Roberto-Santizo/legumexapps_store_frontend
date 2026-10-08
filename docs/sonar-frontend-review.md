# Revisión de hallazgos del frontend

Se conservan los siete pasos, contratos HTTP, traducciones, clases visuales, reglas de mezcla y cantidades. El estado, invalidación, selección automática y control de solicitudes permanecen en `CatalogQuoteWizard`. No se modificó el backend ni se hizo commit/push.

## Resultado por hallazgo

| # | Hallazgo y validez | Acción y conservación del comportamiento |
| --- | --- | --- |
| 1 | Comentarios TODO: falsos positivos como tareas. | Los tres comentarios contienen la palabra española `todo`/`Todo`. Se reescribieron conservando paginación, snapshot y filtros. Esa coincidencia es consistente con la regla; la configuración local no permite confirmar los parámetros del perfil del servidor. No aparecieron `FIXME` ni `pendiente` en esos comentarios. No se inventó funcionalidad. |
| 2 | Ternario anidado del estado de mezcla: válido. | Secuencia `if/else`: exacta, exceso, faltante, precisión. Mismo orden, traducciones y cálculos. |
| 3 | Ternario anidado de estilos: válido. | Variable `statusClasses` con las mismas clases para válido, exceso y normal. |
| 4 | Foco del stepper: ya corregido; ternario de círculos: válido. | El `<ol>` ya carecía de `tabIndex`. Se conservaron ref, efecto de scroll y `aria-current`; `stepCircleClasses` mantiene los tres estilos. Se reforzó la prueba existente. |
| 5 | Optional chaining: aplicable. | Se compara el ref con `configuration?.id`. Sin configuración, el ID es `undefined`, distinto de cualquier valor del ref (`number \| null`); el efecto sigue retornando. Con configuración, se compara exactamente el mismo ID. |
| 6 | Responsabilidades del wizard: válido. | Se extrajeron perfil, configuración, empaque, resultado, cantidades y contexto. `resolveCatalogSelection` deriva opciones compatibles y valida el input con el mismo schema. No se movió estado a los pasos ni se agregó un contexto global. |
| 7 | Complejidad de `finalize`: válido. | `handleFinalizeError` y `refreshPreviewAfterConflict` separan errores y recuperación 409. Se mantienen procesamiento, secuencia, pending, preview/token/key, refetch, revisión de precio, callback, resultado y cleanup. Todas las respuestas se comprueban contra la secuencia vigente. |
| 8 | `<output>`: recomendación parcialmente aplicable. | Conteo de búsqueda, estado calculado de mezcla y total actualizado usan `<output>` con anuncio polite/atomic y display block. `noMaterials`, `empty`, `invalidQuantity` y `successHint` conservan `<p>` con `aria-live="polite"` y `aria-atomic="true"`: son mensajes informativos, de validación o confirmación, no valores calculados. No se forzó `<output>` en esos casos. No hay elementos de bloque `<p>` dentro de los nuevos outputs. |
| 9 | Ternario del breakdown de empaque: válido. | Mapa `packagingByLevel` con unit/intermediate/pallet y los mismos fallbacks `[]` para los dos primeros niveles. |
| 10 | Ternario quantityBasis: válido. | Helper tipado `packagingQuantityBasis`, variable antes del input: unit→per_unit, pallet→valor del formulario, intermediate→null. |
| 11 | Template literal anidado: válido. | Sufijo calculado antes del label. Texto e i18n idénticos. |
| 12 | Ternario zIndex: válido. | `showcaseZIndex`: 0→3, 1→2, resto→1. Animaciones, observer, temporizador y reducedMotion se conservan. |
| 13 | Defaults Juice: válido. | `juiceFieldDefault` devuelve `unknown`, preserva la semántica nullish y prioriza image→undefined. Prueba del formulario para 0, false, vacío, null, ausencia y creación sin row. |
| 14 | Cobertura: oportunidad de protección real. | Se revisaron las pruebas existentes de navegación, selección, mezcla, empaque, preview/confirm, retry y 409. Se agregaron cantidad inválida, confirmación obsoleta y refresh 409 obsoleto mientras una solicitud nueva sigue pendiente. No se agregaron pruebas de implementación para cada helper. |
| 15 | Revisión general: aplicable. | Pasos sin estado propio, cantidades compartidas, callbacks con una responsabilidad y JSX separado por secciones. TypeScript y lint comprueban imports y tipos; no se introdujo `any` ni supresiones de Sonar. |

## Archivos de código y pruebas modificados en esta revisión

Rutas relativas a `frontendLegumexStore`:

- `src/feature/client/api/client.api.ts`
- `src/feature/customQuote/component/customQuoteSpecification.component.tsx`
- `src/feature/customQuote/page/adminCustomQuoteList.page.tsx`
- `src/feature/customQuote/component/catalogQuoteMixBuilder.component.tsx`
- `src/feature/customQuote/component/catalogQuoteUi.component.tsx`
- `src/feature/customQuote/component/catalogQuoteWizard.component.tsx`
- `src/feature/customQuote/component/catalogQuoteState.ts`
- `src/feature/customQuote/component/catalogQuoteProfileStep.component.tsx` (nuevo)
- `src/feature/customQuote/component/catalogQuoteConfigurationStep.component.tsx` (nuevo)
- `src/feature/customQuote/component/catalogQuotePackagingStep.component.tsx` (nuevo)
- `src/feature/customQuote/component/catalogQuoteResultStep.component.tsx` (nuevo)
- `src/feature/customQuote/component/catalogQuoteQuantities.component.tsx` (nuevo)
- `src/feature/customQuote/component/customQuotePackagingOptionsSection.component.tsx`
- `src/feature/customQuote/component/customQuoteRawMaterialOptionsSection.component.tsx`
- `src/feature/home/component/heroProductShowcase.component.tsx`
- `src/feature/juice/component/juiceForm.component.tsx`
- `scripts/catalog-quote.test.cjs`
- `scripts/sonar-regression.test.cjs`
- `docs/sonar-frontend-review.md` (este informe)

Los archivos generados de revisión visual están en `artifacts/catalog-ui`. Los demás cambios existentes en el workspace se conservaron.

## Validación

- `npx tsc -b`: correcto.
- `npm run lint`: correcto. El proyecto configura **Oxlint**, no ESLint; no se instaló un linter alternativo.
- `npm test`: **57/57** pruebas correctas, incluyendo CatalogQuote.
- `npm run build`: correcto; Vite mantiene el aviso de chunks mayores a 500 kB.
- Pruebas finales específicas de CatalogQuote/regresión: **34/34** correctas después de la última extracción y revisión de JSX.
- Chrome headless: sin desbordamientos en 375, 768, 1024 y 1440 px; capturas generadas en `artifacts/catalog-ui`.

No se ejecutó SonarScanner en esta revisión: la puntuación definitiva de complejidad debe compararse con el próximo análisis. La suite actual no genera LCOV y no hay una ruta LCOV declarada en la configuración local de Sonar; agregar pruebas no garantiza que desaparezca la marca de cobertura sin un reporte importado. No se modificó el pipeline de cobertura.
