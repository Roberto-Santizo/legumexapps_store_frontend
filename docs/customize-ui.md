# Customize: color and raw material search

This refinement is scoped to the public Customize components. It does not change discovery, compatibility, quote requests, exact percentage validation, PDFs, Ready-made or admin screens.

## Existing palette

- `dorado`: active step, selection borders, composition ring, progress and small highlights.
- `warning-fg`: readable amber text for percentages and the active step. This existing foreground also adapts to the theme; it does not imply a warning state here.
- `brand-900`: contrasting number on the golden active step.
- Brand green: primary actions, links, completed checks and success. Red: remove and exceeded totals. Surfaces, icons and general headings are neutral.

The main card remains white; selected cards use a subtle mint surface and green checks. The final color rebalance adds one complementary slate hue for large surfaces.

## Search behavior

The mix builder searches only its `materials` prop, which the wizard already filters by the selected context, ingredient type and certification. Discovery continues enforcing mixability. Search cannot add anything outside that compatible set.

The current DTO supplies `displayName` as its only searchable customer-facing text field. Search normalizes Unicode accents using NFD, removes combining marks, trims the query and matches without case sensitivity. It uses local filtering with `useMemo`; typing sends no network requests and never changes percentages.

Eight matching rows appear initially. Show more adds eight rows at a time inside a bounded scroll region. Search and clear reset that visible limit. Selected rows remain visible with an Added check and a disabled add action. Adding a material keeps the current search so customers can add multiple related results. The selected mix remains a separate section below the results.

For a future catalog with thousands of compatible options, measure discovery payload size and filtering latency before considering server-side search or virtualization. No backend pagination or additional dependency is required for the current experience.

## Verification and visual fixtures

Run `npm test`, `npm run lint`, `npx tsc -b` and `npm run build`. Tests cover normalized name search, clear, unknown results, duplicates, limited initial rendering, compatibility and preserved percentages/navigation, alongside existing quote/PDF regressions.

After building, set `CATALOG_UI_ARTIFACTS=1` and run `npm test` to generate `artifacts/catalog-ui/review.html`. Run `node scripts/review-catalog-ui.cjs` with installed Chrome (or `CHROME_PATH`) to check 375, 768, 1024 and 1440 px and save screenshots. Extra mix scenes cover empty search, a query, multiple ingredients, exactly 100%, overflow and no results. These scenes use explicit test fixtures, not production catalog data.

## Final visual polish

The existing layout and all search/quote behavior stay unchanged. Two centralized surface tokens, `customize-mint` and `customize-cream`, mix existing brand colors with `surface`. Mint groups search, selection and success; cream is limited to small composition accents and inputs. Percentage controls retain 44px touch targets with circular outlines. Summary bullets cycle through four existing tokens by selected position; the SVG continues showing only total progress. Section heading bands carry the same palette through configuration, packaging and review.

## Final color rebalance

The reusable customize-slate token (#EEF4F6) replaces the cream page background, mix summary, quantity tiles, review heading bands and cost summary. customize-slate-border derives a structural border from this same hue and the existing neutral foreground. The main wizard and ingredient cards stay white. Gold remains on the active step, percentages, composition ring/progress and small controls; mint remains on search, selection and success. Layout, sizing, navigation, components and business behavior are unchanged.

## Seven-step completion

Visible steps are category, subcategory, type/certification, mix, configuration, packaging/pallets and result. Configuration selection still paints before auto-advancing. Packaging Continue obtains (or reuses an unchanged) preview, confirms its token with the existing idempotency key, then renders the persisted response. A synchronous lock and disabled fieldset prevent repeated submission and editing during processing. Errors preserve selections; retries retain the key. A 409 fetches an updated preview, displays its total and requires another click, including when the refresh initially fails. Result reuses the former review sections with confirmed composition, logistics, packaging, quantities and USD total. Weight is displayed from snapshot grams converted to kg. No wizard Previous, Continue or Confirm appears there. Existing order-summary new-quote/PDF/email actions continue using confirmed document lines, with the same public cost visibility and historical rendering.
