# Sistema de diseño Legumex — identidad visual

Basado en el logo real de Agroindustria Legumex ("Growing Quality. Delivering Trust."). Colores extraídos directamente del logo. Este documento es la base del rediseño; Codex lo aplicará por fases.

## Personalidad de marca
Natural, fresco, confiable, profesional. Agroindustria de exportación (frutas, vegetales, jugos). El diseño debe sentirse **limpio y premium**, con mucho espacio en blanco y el verde de marca como protagonista — NO recargado, NO colorido de más. Serio pero con vida (es campo, es fresco).

## Paleta de color (del logo)

**Verdes de marca (primarios):**
- `brand-900` (verde profundo, texto/montaña del logo): **#044E27** — el color institucional principal.
- `brand-700` (verde medio): **#0A6B38** — hover/variante del principal.
- `brand-500` (verde hoja, acento secundario): **#6EAC19** — el verde brillante de la colina/hoja. Úsalo con moderación para acentos, highlights, estados activos.
- `brand-300` (verde suave): **#9DC092** — fondos sutiles, bordes verdes, badges.

**Neutros (la base — mucho de esto):**
- `ink-900` (texto principal): **#1A2B22** (casi negro con tinte verde, no negro puro).
- `ink-600` (texto secundario): **#5B6B63**.
- `ink-400` (texto tenue/placeholder): **#8A978F**.
- `line` (bordes/divisores): **#E3E8E4**.
- `surface` (tarjetas/paneles): **#FFFFFF**.
- `canvas` (fondo de la app): **#F6F8F5** (blanco con un toque verde-crema muy leve — más cálido que un gris frío).

**Estados:**
- Éxito: **#2E7D32** (verde, coherente con la marca).
- Error/peligro: **#C0362C** (rojo terroso, no estridente).
- Advertencia: **#C98A14** (ámbar tierra).
- Info: **#2A6F8E** (azul apagado, usar poco).

**Dorado de acento (opcional, muy puntual):** el sistema actual usa un dorado (`#...`) en botones primarios. Reemplazarlo: el **botón de acción primaria** debe ser `brand-900` (verde profundo) con texto blanco — se ve mucho más de marca que el dorado. Reservar cualquier dorado solo si hace falta un segundo acento, y tenue.

## Tipografía
- **Una sola familia sans-serif moderna y legible**, de buena calidad (NO la default del navegador, que es lo que grita "hecho rápido"). Recomendado: **Inter** o **Plus Jakarta Sans** (vía Google Fonts / fontsource, que ya se usa en el repo). Títulos con un peso 600–700; cuerpo 400–500.
- Escala tipográfica clara: títulos de página grandes y con aire; jerarquía evidente entre título, subtítulo y cuerpo. Interlineado cómodo (1.5 en cuerpo).
- Los números (precios, costos, cantidades) en **tabular/mono-aligned** para que las columnas de la tabla queden alineadas.

## Estilo de componentes
- **Esquinas:** radios suaves y consistentes (ej. 10–12px en tarjetas/inputs, 8px en botones). Nada de esquinas vivas ni exageradamente redondas.
- **Sombras:** muy sutiles (una sola sombra ligera para elevar tarjetas; nada de sombras duras). El look es "plano con profundidad mínima".
- **Espaciado:** generoso y consistente (escala de 4/8px). El aire es lo que hace que se vea premium y no "apretado de AI".
- **Botones:** primario = verde profundo sólido; secundario = contorno verde sobre blanco; peligro = rojo terroso. Altura cómoda (40–44px), estados hover/focus claros.
- **Inputs:** borde `line`, foco con anillo verde de marca, label clara arriba, el asterisco rojo requerido ya existente. Buen padding.
- **Tablas:** encabezado con fondo `canvas` o `brand-300` muy suave, filas con hover sutil, divisores finos `line`, buen padding vertical. Legibles, no apretadas.
- **Navegación/sidebar:** fondo blanco o `brand-900` (a elegir en la fase de layout); ítem activo marcado con el verde de marca; iconografía lineal simple y consistente.
- **Badges/estados:** pill suaves con los colores de estado en versión clara (fondo tenue + texto del color).

## Modo oscuro
El repo ya soporta claro/oscuro. El sistema debe definir los mismos tokens en oscuro: `canvas` oscuro verdoso (#101613), `surface` #19211C, texto claro, y el verde hoja (`brand-500`) gana protagonismo como acento sobre fondo oscuro. Mantener contraste AA.

## Responsive (requisito: 100%)
- Mobile-first: todo debe verse y funcionar perfecto en teléfono. Tablas con scroll horizontal contenido o vista de tarjetas en móvil. Menú colapsable. Formularios de una columna en móvil, dos en desktop donde tenga sentido.
- Probar en 3 anchos: teléfono (~380px), tablet (~768px), desktop (~1280px+).

## Cómo se aplica (fases — NO todo de una)
1. **Tokens + tipografía:** definir todos los colores/tipografía/espaciado como variables centrales (CSS vars / tema Tailwind). Cargar la fuente. Sin cambiar aún ninguna pantalla — solo la base.
2. **Componentes base:** botón, input, select, tabla, card, badge, modal — que tomen los tokens nuevos. Al cambiarlos, mejora toda la app de forma centralizada.
3. **Layout:** sidebar/nav + header + fondo de la app + el logo real de Legumex en su lugar.
4. **Pantalla modelo:** aplicar y pulir UNA pantalla (ej. la lista de productos) como referencia, verificar que se ve "chilero".
5. **Resto de pantallas por secciones**, verificando cada una.

Cada fase compila y se revisa antes de la siguiente.