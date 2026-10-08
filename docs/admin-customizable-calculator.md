# Cotizador administrativo de productos personalizables

Fecha: 2026-10-07.

## Causa y solución

`AdminQuoteCalculatorPage` solo montaba el cotizador fijo. El wizard personalizable existente usaba `salespersonApi`, endpoints autenticados como cliente y una finalización que calculaba un preview y luego llamaba a `confirmCatalogAPI`. Reutilizarlo directamente habría usado la sesión equivocada y creado una cotización de cliente.

El cotizador interno `/admin/quotes/calculator` ahora permite elegir **Productos fijos** o **Productos personalizables**, siguiendo el selector del administrador unificado. La opción se conserva en `?type=fixed|customizable`. La ruta conserva su guard y permiso `quotes:calculate`.

El contenido y handlers existentes del cotizador fijo se conservaron en `FixedAdminQuoteCalculatorPage`. El personalizado monta el mismo `CatalogQuoteWizard` con `mode="admin"`; no duplica reglas de porcentajes, configuración ni selección de empaque. Se reutilizan los pasos de perfil, mezcla, configuración, packaging, cantidades y resultado. `QuoteResultCard` presenta el desglose administrativo completo a partir de los costos oficiales recibidos.

## Endpoints y persistencia

| Flujo | Endpoint | Comportamiento |
| --- | --- | --- |
| Admin fijo | `POST /admin/quotes/preview` | Sin cambios: calcula, no guarda. |
| Admin personalizable: catálogo | `GET /admin/quotes/catalog-configurations` | Descubrimiento compartido, autenticación staff y `quotes:calculate`. |
| Admin personalizable: cálculo | `POST /admin/quotes/catalog-preview` | Reutiliza `calculateCatalogQuote` dentro de una transacción consistente; devuelve configuración, snapshot, cantidades, desglose y total. No guarda registros. |
| Cliente personalizable: preview | `POST /custom-quotes/catalog-preview` | Sin cambios: cálculo y token firmado para confirmar. |
| Cliente personalizable: confirmación | `POST /custom-quotes/catalog-confirm` | Sin cambios: valida preview y crea `CustomQuote`, con idempotencia y revisión de cambios de precio. |

Los endpoints están montados bajo el prefijo general del API existente. Los administrativos utilizan `api` y la sesión staff; los de cliente conservan `salespersonApi`.

La finalización administrativa devuelve el resultado después de calcular y termina antes de la rama de confirmación. No ejecuta `confirmCatalogAPI`, callbacks de registro del cliente, guardado de quotes, borradores, creación de leads ni creación de representantes. El backend no expone una confirmación administrativa. Su respuesta carece de ID de cotización, estado, cliente y token de confirmación.

El servicio administrativo utiliza el motor compartido de costos y solo consultas del catálogo/costos. La transacción garantiza una lectura consistente, no crea filas de preview. Como no se escriben las tablas que alimentan las cotizaciones recibidas o indicadores, el cálculo interno no altera esas listas ni el Dashboard. No se inventan clientes ni se guarda una cotización pendiente.

## Estados, resultado e i18n

- Se mantienen validación exacta de mezcla al 100%, materiales compatibles, defaults de empaque y pallets positivos enteros.
- El bloqueo inmediato con ref evita doble envío; el contador de secuencia descarta respuestas tras cambios, navegación o desmontaje.
- Ante un error administrativo se mantienen las selecciones para reintentar. Cada cálculo administrativo consulta precios actuales; no reutiliza un preview antiguo. La revisión 409 e idempotencia del cliente permanecen intactas.
- El resultado muestra mezcla, porcentajes, presentación, empaques, pallets, cajas, unidades, peso, costos y total. La acción de nueva cotización reinicia únicamente el estado local.
- Se agregaron `adminQuoteCalculator.customizableTitle` y `adminQuoteCalculator.calculatedHint` en ES y EN. Se traducen durante el render. Los nombres y datos recibidos del backend siguen siendo literales.

## Validación

- Frontend: **89 tests aprobados**, incluyendo recorrido administrativo, selección de packaging, envío de pallets, resultado, bloqueo de doble cálculo, cantidades inválidas, mezcla incompleta, errores y respuestas obsoletas. Un test de selección comprueba que el fijo conserva `previewAdminQuoteAPI` y su payload.
- Backend: **57 tests aprobados** en las suites de servicio catalog, rutas catalog cliente y rutas admin quotes. Cubren autenticación staff, rechazo de sesión cliente, `quotes:calculate`, input estricto, cálculo oficial y ausencia de confirmación/guardado. Se comprueba que el cálculo no llama a creación de CustomQuote, Quote, Lead, QuoteDraft, Salesperson, Product o ProductVariant.
- Las regresiones del cliente mantienen preview → confirmación, idempotencia y revisión de precios; las rutas fijas conservan su cálculo sin persistencia.
- TypeScript/build del frontend y backend: correctos. Vite mantiene la advertencia existente sobre chunks mayores a 500 kB.
- El frontend usa **Oxlint**, no tiene ESLint instalado. Lint sobre `src`, `scripts` y configuración Vite sin diagnósticos; también se verificaron las nuevas rutas/controlador backend con Oxlint.
- Escaneo i18n: 375 archivos, recursos ES/EN con paridad y sin claves usadas faltantes.
- Revisión de diff: se conservaron los cambios previos y concurrentes, incluidos los filtros de fechas y refactors de Sonar/i18n. Los archivos intervenidos pasan `git diff --check`.

Las comprobaciones de persistencia son tests de servicio/HTTP aislados y revisión del recorrido de escrituras. No se ejecutó una cotización contra una BD real ni se comprobó un Dashboard en producción. No se hizo commit ni push.

## Archivos intervenidos

Backend:

- `src/features/customQuote/services/catalogQuote.service.ts`
- `src/features/customQuote/controllers/adminCatalogQuote.controller.ts` (nuevo)
- `src/features/quote/routes/adminQuote.routes.ts`
- `src/features/customQuote/services/catalogQuote.service.test.ts`
- `src/features/quote/routes/adminQuote.routes.test.ts`

Frontend:

- `src/feature/quote/page/adminQuoteCalculator.page.tsx`
- `src/feature/customQuote/page/adminCatalogQuoteCalculator.page.tsx` (nuevo)
- `src/feature/customQuote/api/adminCatalogQuote.api.ts` (nuevo)
- `src/feature/customQuote/component/catalogQuoteWizard.component.tsx`
- `src/feature/customQuote/component/catalogQuoteResultStep.component.tsx`
- `src/shared/i18n/locales/es/translation.json`
- `src/shared/i18n/locales/en/translation.json`
- `scripts/catalog-quote.test.cjs`
- `scripts/catalog-quote-ui.test.cjs`
- `docs/admin-customizable-calculator.md` (este informe)

El escaneo actualiza además `artifacts/i18n/audit.json`; builds y tests generan los artefactos locales habituales.
