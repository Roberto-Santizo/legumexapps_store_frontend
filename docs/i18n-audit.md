# Auditoría de internacionalización del frontend

Fecha: 2026-10-07. Alcance: `src/` completo, 373 archivos TypeScript/TSX. Se respetaron los cambios previos y concurrentes. No se modificó el backend ni se hizo commit o push.

## Hallazgos y correcciones

| Hallazgo | Corrección |
| --- | --- |
| Errores de Customize, validación del modal PDF e importación guardaban traducciones resueltas en estado. | Guardar claves y traducir durante el render, conservando los datos y el flujo existente. |
| Toasts estáticos conservaban el idioma en que se abrieron. | `TranslatedMessage` se suscribe a i18next dentro del toast. `showErrorToast` distingue errores controlados por frontend de mensajes literales del servidor. |
| Respuestas que no cumplen el schema y errores de transporte quedaban congelados o mostraban mensajes técnicos en inglés. | `FrontendI18nError` conserva una clave; red, timeout y respuesta inesperada se traducen. No se comparan textos de errores del backend. |
| LeadCapture mostraba mensajes predeterminados de Zod; el porcentaje de procesamiento contenía un mensaje español; el límite del mix podía quedar congelado. | Usar el traductor de errores existente y claves para los errores personalizados, sin cambiar reglas, valores ni schemas de API. |
| React Select incluía mensajes de carga, búsqueda y anuncios de lector de pantalla en inglés. | Mensajes compartidos traducidos, con interpolación y pluralización; las etiquetas procedentes de BD se conservan. |
| El catálogo local de unidades tenía etiquetas españolas fijas. | Traducir solo las opciones de creación/edición por su clave técnica; no alterar el catálogo que participa en comparaciones ni los nombres persistidos. |
| Idiomas, descripción del logo, dirección, etiqueta SKU y región de notificaciones necesitaban recursos de UI. | Incorporar claves ES/EN; conservar marca, dirección real, SKU, códigos y contacto. |
| Fechas visibles y meses del gráfico usaban siempre el locale español. | Pasar el idioma activo a los formateadores de presentación. La fecha comercial de Guatemala, filtros y valores enviados al servidor permanecen iguales. |
| El atributo `html.lang` no seguía el selector. | Sincronizarlo con `languageChanged`, manteniendo el detector y la persistencia existentes. |

Se revisaron constantes, columnas, opciones, `useMemo`, `useCallback` y efectos. Los textos traducidos existentes en configuraciones se resuelven durante el render o tienen dependencias reactivas; no se añadieron dependencias indiscriminadas. Los principales problemas encontrados estaban en estado y notificaciones con texto ya resuelto.

## Recursos

Se agregaron **36 claves por idioma**, dentro de los namespaces existentes:

- `common.logoAlt`, `common.selectLanguage`, `common.languages.es`, `common.languages.en`, `common.notifications`.
- `common.selectA11y.menu`, `tab`, `value`, `inputSearch`, `input`, `disabled`, `cleared`, `removed`, `selected`, `focused`, `disabledState`, `selectedState`, `filtered`, `results_one`, `results_other`.
- `home.leadCapture.contact.address`.
- `quote.pdf.modal.emailUnavailable`.
- `adminCustomQuote.spec.sku`.
- `processingCost.form.percentageLimit`.
- `unit.catalog.gram`, `kilogram`, `pound`, `ounce`, `ton`, `milliliter`, `liter`, `gallon`, `piece`, `dozen`.
- `errors.network`, `errors.timeout`.

No se encontraron claves originales utilizadas que faltaran en uno de los idiomas. Las claves nuevas existen en ambos. La revisión final no encontró diferencias de estructura ni claves literales/indirectas inexistentes. Los tests comprueban interpolaciones, plurales y familias dinámicas de Juice y unidades. Se conservaron contenedores de arrays y claves dinámicas; no se borraron recursos por un simple resultado de búsqueda sin usos.

## Contenido conservado y límites

- Nombres de clientes, productos, materiales, categorías y unidades persistidas; descripciones de permisos; valores personalizados; traducciones almacenadas por administradores; SKU, IDs, códigos y snapshots históricos permanecen literales. No se convierten en claves.
- Mensajes `data.message`, errores y observaciones enviados por backend permanecen literales. El backend no proporciona una clave de traducción en esos contratos.
- `consumptionRule` del preview de importación de empaques es texto generado y traducido por el **servidor**, comprobado mediante lectura de los controladores. La respuesta ofrece una cadena, no una clave con todos sus parámetros. Puede conservar el idioma de la respuesta después de cambiar la bandera. No se inventó un diccionario ni se relanzó la operación; resolverlo requiere un contrato traducible del backend, fuera del alcance de esta tarea.
- Los errores desconocidos de bibliotecas mantienen el tratamiento existente; solo códigos de transporte reconocidos y errores propios reciben traducciones del frontend.
- No quedaron textos intervenidos cuyo origen frontend/BD fuese incierto. Los anteriores casos con cadena literal del servidor se documentan explícitamente.
- Los textos directos restantes detectados son `Legumex`, `kate@legumex.net` y `g`, además del alt de marca `Legumex`. Son nombres propios, contacto y símbolos universales. Se mantienen nombres técnicos de archivos PDF y formatos comerciales de USD; no se alteran cálculos ni documentos históricos.

## Verificación

- **Tests:** `npm test`, 85 aprobados, 0 fallidos; incluye 7 pruebas específicas de i18n y regresiones de los flujos existentes.
- **Typecheck/build:** `npm run build` ejecutó `tsc -b` y Vite correctamente, con código de salida 0. Vite mantiene su advertencia sobre chunks de más de 500 kB.
- **Lint:** el proyecto utiliza **Oxlint**, no tiene ESLint instalado. `node node_modules/oxlint/bin/oxlint src scripts vite.config.ts` terminó correctamente, sin diagnósticos. `npm run lint` recorre también el bundle temporal de Sonar en `.scannerwork` y produjo diagnósticos ajenos al código del proyecto; se interrumpió y se verificó el código fuente por separado sin cambiar la configuración.
- **Escaneo:** `node scripts/audit-i18n.cjs`; 373 archivos, paridad ES/EN correcta, 0 claves utilizadas faltantes. Incluye inventario de cadenas, expresiones dinámicas y textos JSX/atributos para revisión de origen; no pretende clasificar automáticamente datos de BD como traducciones.
- **Navegador real:** fixture con componentes de producción y datos controlados; bandera ES → EN → ES → EN. Se verificaron texto estático, validaciones ya visibles, modal PDF, toast abierto, conservación de un nombre ingresado y una descripción de permiso del backend. La URL, el montaje y `performance.timeOrigin` permanecen iguales durante los cambios. Una recarga posterior verifica persistencia, no es necesaria para traducir.
- La prueba de navegador es representativa de los componentes compartidos; no equivale a una navegación manual de todas las rutas administrativas con una sesión real.
- **Diff:** se revisaron los cambios de UI, estado, recursos y manejo de errores; `git diff --check` sobre el inventario de esta tarea pasó sin problemas de whitespace. Se conservaron los cambios ajenos existentes y concurrentes.

Evidencias: `artifacts/i18n/audit.json`, `artifacts/i18n/browser-results.json`, `scripts/i18n.test.cjs`, `scripts/review-i18n-ui.cjs`. El fixture no envía correos, genera cotizaciones ni modifica datos del servidor.

## Archivos intervenidos por esta tarea

El inventario siguiente identifica los archivos tocados por i18n, incluidos archivos con trabajo previo o concurrente. No atribuye a esta tarea todo su diff respecto de HEAD.

- `artifacts/i18n/review.html`
- `artifacts/i18n/review.jsx`
- `docs/i18n-audit.md`
- `scripts/audit-i18n.cjs`
- `scripts/catalog-quote-ui.test.cjs`
- `scripts/i18n.test.cjs`
- `scripts/review-i18n-ui.cjs`
- `src/App.tsx`
- `src/feature/category/page/createCategory.page.tsx`
- `src/feature/category/page/createSubCategory.page.tsx`
- `src/feature/category/page/editCategory.page.tsx`
- `src/feature/category/page/editSubCategory.page.tsx`
- `src/feature/client/page/createClient.page.tsx`
- `src/feature/client/page/editClient.page.tsx`
- `src/feature/customQuote/component/adminCustomQuoteTable.component.tsx`
- `src/feature/customQuote/component/catalogQuoteWizard.component.tsx`
- `src/feature/customQuote/component/customQuoteSpecification.component.tsx`
- `src/feature/customQuote/component/useCustomQuoteOptionMutations.ts`
- `src/feature/customQuote/page/adminCustomQuoteDetail.page.tsx`
- `src/feature/dashboard/component/quotesTrendChart.component.tsx`
- `src/feature/destination/component/destinationTable.component.tsx`
- `src/feature/destination/page/createDestination.page.tsx`
- `src/feature/destination/page/editDestination.page.tsx`
- `src/feature/home/component/leadCaptureForm.component.tsx`
- `src/feature/home/component/leadCaptureSection.component.tsx`
- `src/feature/ingredient/component/createIngredientModal.component.tsx`
- `src/feature/ingredient/component/ingredientTable.component.tsx`
- `src/feature/ingredient/page/createIngredient.page.tsx`
- `src/feature/ingredient/page/editIngredient.page.tsx`
- `src/feature/juice/component/juiceForm.component.tsx`
- `src/feature/lead/component/leadTable.component.tsx`
- `src/feature/lead/page/editLead.page.tsx`
- `src/feature/packaging/component/createPackagingMaterialModal.component.tsx`
- `src/feature/packaging/component/packagingTable.component.tsx`
- `src/feature/packaging/page/createPackaging.page.tsx`
- `src/feature/packaging/page/editPackaging.page.tsx`
- `src/feature/packagingGroup/page/packagingGroup.page.tsx`
- `src/feature/presentation/component/createPresentationModal.component.tsx`
- `src/feature/presentation/component/presentationTable.component.tsx`
- `src/feature/presentation/page/createPresentation.page.tsx`
- `src/feature/presentation/page/editPresentation.page.tsx`
- `src/feature/processingCost/component/processingCostForm.component.tsx`
- `src/feature/processingCost/component/processingCostTable.component.tsx`
- `src/feature/processingCost/page/createProcessingCost.page.tsx`
- `src/feature/processingCost/page/editProcessingCost.page.tsx`
- `src/feature/processingCost/schema/processingCost.schema.ts`
- `src/feature/product/component/initialProductImportPanel.component.tsx`
- `src/feature/product/component/productIngredientSection.component.tsx`
- `src/feature/product/component/productRawMaterialSection.component.tsx`
- `src/feature/product/component/productTable.component.tsx`
- `src/feature/product/component/productVariantIntermediateMaterialSection.component.tsx`
- `src/feature/product/component/productVariantPalletMaterialSection.component.tsx`
- `src/feature/product/component/productVariantSection.component.tsx`
- `src/feature/product/component/productVariantUnitMaterialSection.component.tsx`
- `src/feature/product/page/createProduct.page.tsx`
- `src/feature/product/page/editProduct.page.tsx`
- `src/feature/quote/component/quotePdfButton.component.tsx`
- `src/feature/quote/page/adminQuoteCalculator.page.tsx`
- `src/feature/quote/page/quoteRequest.page.tsx`
- `src/feature/quoteDraft/component/quoteDraftTable.component.tsx`
- `src/feature/rawMaterial/component/createRawMaterialModal.component.tsx`
- `src/feature/rawMaterial/component/rawMaterialTable.component.tsx`
- `src/feature/rawMaterial/page/createRawMaterial.page.tsx`
- `src/feature/rawMaterial/page/editRawMaterial.page.tsx`
- `src/feature/role/component/rolePermissionSection.component.tsx`
- `src/feature/role/page/createRole.page.tsx`
- `src/feature/role/page/editRole.page.tsx`
- `src/feature/salesperson/page/createSalesperson.page.tsx`
- `src/feature/salesperson/page/editSalesperson.page.tsx`
- `src/feature/siteImage/component/siteImagePanel.component.tsx`
- `src/feature/unit/page/createUnit.page.tsx`
- `src/feature/unit/page/editUnit.page.tsx`
- `src/feature/user/page/createUser.page.tsx`
- `src/feature/user/page/editUser.page.tsx`
- `src/shared/api/handleApiError.ts`
- `src/shared/auth/credentialLoginPage.component.tsx`
- `src/shared/component/authCard.component.tsx`
- `src/shared/component/bulkImportPanel.component.tsx`
- `src/shared/component/creatableSearchableSelect.component.tsx`
- `src/shared/component/searchableSelect.component.tsx`
- `src/shared/component/uploadImages.component.tsx`
- `src/shared/format/businessDate.ts`
- `src/shared/format/date.ts`
- `src/shared/hook/useStatusToggle.ts`
- `src/shared/i18n/frontendI18nError.ts`
- `src/shared/i18n/i18n.ts`
- `src/shared/i18n/locales/en/translation.json`
- `src/shared/i18n/locales/es/translation.json`
- `src/shared/i18n/searchableSelectMessages.ts`
- `src/shared/i18n/showErrorToast.tsx`
- `src/shared/i18n/translatedMessage.component.tsx`
- `src/shared/layout/FooterNewsletterForm.tsx`
- `src/shared/layout/LanguageSwitch.tsx`
- `src/shared/layout/Sidebar.tsx`
