# Auditoría y limpieza final del frontend

Se revisaron git status y diff antes de editar. El árbol ya contenía numerosos cambios de trabajo previo, incluidos componentes todavía no tracked. Se conservaron. Esta tarea no modificó backend, contratos, diseño, reglas empresariales ni cálculos.

## Auditoría y decisiones

Knip recorrió el grafo completo del frontend, incluidas rutas e imports dinámicos. Sus resultados se contrastaron con búsquedas en src, CSS, configuración y package.json. Se revisaron ambos paneles de importación, sus clientes API, schemas compartidos, Product Editor, Packaging, PackagingGroup, estado de mutaciones y traducciones. No se encontraron console.log/debug temporales en src. No se borraron componentes o schemas basándose solo en su antigüedad.

Se eliminó el cliente bulkImportProductsAPI de la antigua importación directa: no tenía referencias tras adoptar preview/confirm. La descarga de plantilla permanece. El backend conserva su endpoint antiguo, sin cambios.

UnitSelect no tenía imports ni referencias dinámicas. Se eliminó el archivo y su comentario obsoleto en unit.api.ts.

Se eliminaron cuatro tipos sin referencias: CustomQuoteCatalogPresentation, SavedCustomQuote, PackagingGroup y ProcessingCostCalculationType. Los schemas y tipos que sí se usan permanecen. Otras declaraciones señaladas por Knip ahora son privadas al módulo: enums Zod, esquemas usados para inferir DTOs, listas internas de campos, tipos internos y helpers. No se eliminaron validaciones activas.

## Archivos modificados

- src/feature/product/api/product.api.ts: elimina API e import postBulkImportFile sin uso.
- src/feature/product/api/initialProductImport.api.ts y productPackagingImport.api.ts: reutilizan envío multipart y manejo de errores; eliminan imports duplicados de Axios, cliente api, handleApiError y BulkImportApiError.
- src/shared/api/bulkImport.api.ts: agrega transporte compartido postBulkImportPreviewFile; conserva archivo, previewHash, endpoints y detalles del backend. bulkImportResponseSchema pasa a privado.
- src/feature/product/component/initialProductImportPanel.component.tsx y productPackagingImportPanel.component.tsx: reutilizan validación de archivo; limpian datos/errores de mutaciones tras importación exitosa. Seleccionar otro archivo sigue limpiando preview y errores. Un fallo conserva el archivo para corregir/revalidar, con preview invalidado cuando corresponde.
- src/feature/unit/api/unit.api.ts: elimina comentario que mencionaba el selector eliminado.
- src/feature/customQuote/schema/adminCustomQuote.schema.ts: enum interno.
- src/feature/customQuote/schema/customQuote.schema.ts: tipo interno y dos tipos muertos eliminados.
- src/feature/customQuote/schema/customQuoteConfig.schema.ts: tipo interno.
- src/feature/destination/schema/destination.schema.ts: enum interno.
- src/feature/juice/constant/juiceFields.ts: cuatro listas usadas por recursos del mismo módulo pasan a privadas.
- src/feature/lead/schema/lead.schema.ts: enum interno.
- src/feature/processingCost/schema/processingCost.schema.ts: enum interno; tipo muerto eliminado.
- src/feature/product/schema/productIngredient.schema.ts: esquema usado para inferir UpdateProductIngredientInput pasa a privado.
- src/feature/packagingGroup/schema/packagingGroup.schema.ts: elimina alias sin consumidores; conserva schema CRUD.
- src/feature/quote/quoteWeight.util.ts: kgToLb sigue funcionando internamente en el formateador.
- src/feature/quote/schema/quote.schema.ts: salespersonQuoteSchema permanece para inferir el DTO, con exportación innecesaria eliminada.
- src/feature/quote/component/quotePackagingConfig.ts: dos tipos pasan a privados.
- src/feature/quoteDraft/schema/quoteDraft.schema.ts: enum interno.
- src/feature/siteImage/schema/siteImage.schema.ts: schemas internos; conserva tipos y respuestas utilizadas.
- src/shared/format/businessDate.ts: constante interna.
- src/shared/i18n/locales/es/translation.json y en/translation.json: elimina seis claves por idioma del panel anterior de productos: description, downloadTemplate, importButton, importing, rowErrorsTitle y rowErrorItem. Solo product.bulkImport.title sigue referenciada. Las explicaciones actuales y traducciones de ambos importadores permanecen.
- package.json y package-lock.json: elimina @fontsource/archivo y @fontsource/jetbrains-mono; añade npm test para ejecutar las pruebas de regresión. CSS solo importa Inter. No se actualizaron versiones.

Archivos nuevos:
- src/shared/utils/importFile.ts: validación compartida de .xlsx no vacío y máximo 5 MiB.
- scripts/import-regression.test.cjs: ocho pruebas con el runner nativo de Node y TypeScript ya instalado, sin dependencias adicionales.
- docs/frontend-cleanup.md: este informe.

Archivo eliminado:
- src/feature/unit/component/unitSelect.component.tsx.

## Lo conservado

- Importador separado de materiales: es mantenimiento activo, no código legado abandonado.
- Defaults de Packaging y ajustes manuales: siguen siendo necesarios en CRUD, Product Editor y mantenimiento.
- Schemas usados para inferir DTOs: una exportación externa innecesaria no implica que el schema sea código muerto.
- getQuoteDestinationsAPI y getAdminQuoteDestinationsAPI: el código documenta explícitamente que transporte está temporalmente desactivado y listo para reactivarse. Se conservaron como decisión funcional existente.
- createUnitSchema/updateUnitSchema: alias deliberado de validaciones iguales; ambos tienen consumidores. Separarlos solo para evitar un aviso duplicaría lógica.
- Product Editor, imágenes, quote wizard, Packaging/PackagingGroup CRUD, recetas y demás importadores: se conservaron sus componentes, rutas y consumidores.
- Textos obtenidos del backend, códigos, bases y nombres de hojas del contrato: no se tradujeron ni transformaron para evitar cambios de contrato.

## Verificación y límites

- **Knip:** al finalizar no reporta archivos, dependencias ni tipos muertos. Devuelve código 1 por dos exportaciones de transporte deliberadamente conservadas y un alias duplicado válido de schemas de unidades. No se ocultaron mediante ignores.
- **Typecheck:** npx tsc -b aprobado.
- **Lint:** npm run lint (Oxlint) aprobado. El proyecto no tiene ESLint ni configuración ESLint instalados; se utilizó el linter configurado, sin agregar supresiones.
- **Tests:** ocho pruebas frontend aprobadas mediante node --test scripts/import-regression.test.cjs; pueden repetirse con npm test. Comprueban validación de archivo, preview sin materiales/con materiales, confirmación/hash/resultado, importador separado, errores específicos y descargas blob. Son pruebas de contratos frontend con HTTP simulado, no prueban parsing real de Excel en backend ni importan datos.
- **Regresión por grafo/typecheck/build:** los consumidores de Product Editor, imágenes, quote wizard y CRUD Packaging/PackagingGroup conservan sus rutas/tipos; no se cambiaron sus requests. No se realizó una prueba manual de esas pantallas en navegador ni una importación real en la base de datos.
- **Build:** npm run build aprobado (TypeScript + Vite). Se mantiene la advertencia existente de chunks superiores a 500 kB.
- **Entorno:** runner Node y Vite inicialmente fallaron por spawn EPERM dentro del sandbox; se reejecutaron con autorización fuera del sandbox.

No se eliminaron warnings para producir una salida artificialmente limpia. La limpieza es limitada a código demostrado sin uso y duplicaciones pequeñas; no agrega flujos, hooks o arquitectura nuevos.
