# Retiro del importador separado de materiales en frontend

## Cambio final

Se retiró ProductPackagingImportPanel de Administración → Productos. Alta inicial: Products and Variants, Excel único opcionalmente con Materiales de Empaque, preview y confirmación. Mantenimiento: buscar producto/SKU → Editar → variante y materiales. Las traducciones ES/EN ahora explican este mantenimiento.

## Archivos eliminados

- src/feature/product/component/productPackagingImportPanel.component.tsx.
- src/feature/product/api/productPackagingImport.api.ts.

Con ellos se eliminaron el panel, estados/mutaciones privados, resumen exclusivo, tipo ProductPackagingImportPreview y wrappers de download/preview/confirm de la carga separada. No había hooks independientes exclusivos adicionales.

## Archivos modificados y compartidos

- src/feature/product/page/product.page.tsx: elimina import y render del panel separado; conserva panel inicial, recetas, ingredientes y tabla de productos.
- src/feature/product/api/initialProductImport.api.ts: importa los schemas compartidos desde su nuevo archivo.
- src/feature/product/schema/packagingImportPreview.schema.ts (nuevo): conserva sin cambiar packagingImportIssueSchema, packagingImportPreviewRowSchema y su schema interno de estado anterior. Se extrajeron del wrapper eliminado porque la carga unificada depende de ellos.
- src/feature/product/component/initialProductImportPanel.component.tsx: utiliza las traducciones conservadas en initialProductImport.
- src/shared/i18n/locales/es/translation.json y en/translation.json: elimina namespace productPackagingImport; traslada solo etiquetas consumidas por la carga inicial a initialProductImport. Conserva textos de archivo/error/preview/nivel/fijo/base/confirmación usados. Elimina título, instrucciones, acciones, estados anteriores y resúmenes exclusivos del importador retirado.
- scripts/import-regression.test.cjs: retira pruebas de wrappers eliminados; conserva pruebas de carga inicial y agrega comprobación de ausencia del panel y conservación de etiquetas.

Se conservaron postBulkImportPreviewFile, BulkImportApiError, isValidImportFile, downloadBlob, descarga de plantilla Products and Variants, tipos de materiales y todos los componentes de edición manual. También permanecen ProductVariantUnitMaterial, ProductVariantIntermediateMaterial y ProductVariantPalletMaterial y sus asociaciones. Packaging CRUD, PackagingGroup, imágenes y quote flow no se modificaron.

## Backend conservado

No se modificó ningún archivo backend. productImport.service.ts importa y ejecuta buildPackagingAssociationPlan y writePackagingAssociationPlan de productPackagingImport.service.ts. Ese servicio y sus helpers/validators siguen siendo compartidos y necesarios.

Los siguientes endpoints quedan activos sin consumidor frontend directo y son candidatos para una limpieza posterior, evaluando posibles clientes externos:
- GET /api/product-packaging-materials/bulk-import/template.
- POST /api/product-packaging-materials/bulk-import/preview.
- POST /api/product-packaging-materials/bulk-import/confirm.

Quedan sus routes/controllers y los métodos específicos del servicio. La futura limpieza no debe borrar el motor compartido.

## Validación

- Búsqueda de referencias: src no contiene referencias al panel/wrappers/namespace ni URLs de la carga separada. Los únicos nombres anteriores en scripts son aserciones de ausencia.
- Knip: no archivos, dependencias ni tipos nuevos sin uso. Código de salida 1 por tres avisos previos deliberadamente conservados: getQuoteDestinationsAPI, getAdminQuoteDestinationsAPI y alias createUnitSchema/updateUnitSchema. No se agregaron ignores.
- Typecheck: npx tsc -b aprobado.
- Oxlint: npm run lint aprobado.
- Tests frontend: npm test, ocho pruebas aprobadas. Verifican archivo .xlsx/límites, respuesta de preview sin materiales (compatibilidad anterior) y con materiales, confirmación/hash/resultado, errores específicos, descarga blob y retiro de panel/traducciones exclusivas.
- Build: npm run build aprobado; permanece la advertencia previa de chunks superiores a 500 kB.

Las pruebas simulan HTTP y comprueban los contratos reales frontend mediante Zod. No ejecutan el parser Excel backend ni hacen importaciones reales. Product Editor/edición manual, Packaging CRUD y PackagingGroup conservaron sus rutas, componentes y contratos y pasaron typecheck/build; no se realizó prueba manual en navegador. No se cambiaron cálculos ni reglas de negocio.

El runner de tests y Vite requirieron reejecución autorizada fuera del sandbox por spawn EPERM.

Este informe sustituye la decisión anterior de conservar el panel frontend por mantenimiento; el backend y el motor compartido siguen conservados.
