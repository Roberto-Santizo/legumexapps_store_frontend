const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")
const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")
const resources = { es: require("../src/shared/i18n/locales/es/translation.json"), en: require("../src/shared/i18n/locales/en/translation.json") }

function loadComponents({ language = "es", slots = [], query, hooks = {} } = {}) {
    let cursor = 0
    const mockReact = { ...React, useEffect: () => {}, useRef: value => ({ current: value }), useMemo: factory => factory(), useState: initial => [cursor < slots.length ? slots[cursor++] : typeof initial === "function" ? initial() : initial, () => {}], ...hooks }
    const t = (key, params = {}) => {
        const value = key.split(".").reduce((item, part) => item?.[part], resources[language])
        assert.equal(typeof value, "string", `Missing ${language} translation: ${key}`)
        return value.replace(/\{\{(\w+)\}\}/g, (_, name) => params[name] ?? "")
    }
    const overrides = { react: mockReact, "react-i18next": { useTranslation: () => ({ t, i18n: { language } }) }, "@tanstack/react-query": { useQuery: () => query }, "../api/catalogQuote.api": {}, "../api/adminCatalogQuote.api": {} }
    const cache = new Map()
    function load(file) {
        file = path.resolve(file)
        if (cache.has(file)) return cache.get(file).exports
        const module = { exports: {} }; cache.set(file, module)
        const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
        const localRequire = name => {
            if (name in overrides) return overrides[name]
            if (name.startsWith("@/") || name.startsWith(".")) {
                const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(file), name)
                return load([`${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate)))
            }
            return require(name)
        }
        vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(localRequire, module, module.exports)
        return module.exports
    }
    return load
}
function all(tree) { return !tree || typeof tree !== "object" ? [] : [tree, ...[].concat(tree.props?.children ?? []).flat(Infinity).flatMap(all)] }
const directory = "src/feature/customQuote/component/"
const materials = [{ rawMaterialId: 1, displayName: "Arándano entero" }, { rawMaterialId: 2, displayName: "Banano en rodajas" }]

test("back-only navigation removes Continue and selection cards retain native keyboard semantics", () => {
    const { CatalogQuoteNavigation, CatalogQuoteSelectionCards } = loadComponents()(directory + "catalogQuoteUi.component.tsx")
    const navigation = renderToStaticMarkup(React.createElement(CatalogQuoteNavigation, { onBack: () => {}, backOnly: true }))
    assert.ok(navigation.includes("Anterior"))
    assert.ok(!navigation.includes("Continuar"))
    const changes = []
    const tree = CatalogQuoteSelectionCards({ value: 5, options: [{ value: 5, text: "Configuration" }, { value: 6, text: "Unavailable", disabled: true }], onChange: value => changes.push(value) })
    const buttons = all(tree).filter(row => row.type === "button")
    assert.equal(buttons[0].props.type, "button") // Native Enter/Space activation uses this same click handler.
    assert.equal(buttons[0].props["aria-pressed"], true)
    assert.ok(buttons[0].props.className.includes("focus-visible:"))
    buttons[0].props.onClick(); assert.deepEqual(changes, [5])
    assert.equal(buttons[1].props.disabled, true)
})

test("mix percentage controls preserve decimals, clamp buttons and remove selected ingredients", () => {
    const changes = []
    const { CatalogQuoteMixBuilder } = loadComponents()(directory + "catalogQuoteMixBuilder.component.tsx")
    const tree = CatalogQuoteMixBuilder({ materials, percentages: { 1: "49.25" }, onChange: (...args) => changes.push(args) })
    const button = label => all(tree).find(row => row.type === "button" && row.props["aria-label"] === label)
    button("Aumentar porcentaje de Arándano entero").props.onClick()
    button("Disminuir porcentaje de Arándano entero").props.onClick()
    button("Eliminar Arándano entero").props.onClick()
    assert.deepEqual(changes, [[1, "50.25"], [1, "48.25"], [1, undefined]])
    const zero = CatalogQuoteMixBuilder({ materials, percentages: { 1: "0" }, onChange: () => {} })
    assert.equal(all(zero).find(row => row.props?.["aria-label"] === "Disminuir porcentaje de Arándano entero").props.disabled, true)
    const full = CatalogQuoteMixBuilder({ materials, percentages: { 1: "100" }, onChange: () => {} })
    assert.equal(all(full).find(row => row.props?.["aria-label"] === "Aumentar porcentaje de Arándano entero").props.disabled, true)
})

test("mix summary covers empty, remaining, exact, overflow and invalid precision in both languages", () => {
    for (const language of ["es", "en"]) {
        const { CatalogQuoteMixBuilder } = loadComponents({ language })(directory + "catalogQuoteMixBuilder.component.tsx")
        for (const [percentages, key, amount] of [[{}, "remaining", "100.00"], [{ 1: "75" }, "remaining", "25.00"], [{ 1: "50", 2: "50" }, "valid"], [{ 1: "60", 2: "50" }, "over", "10.00"], [{ 1: "50.001", 2: "49.999" }, "precision"]]) {
            const html = renderToStaticMarkup(React.createElement(CatalogQuoteMixBuilder, { materials, percentages, onChange: () => {} }))
            assert.ok(html.includes(resources[language].catalogQuote.ui[key].replace("{{amount}}", amount)))
            assert.ok(html.includes('aria-live="polite"'))
            assert.ok(html.includes('max="100"'))
        }
    }
})

test("search offers matching backend materials and marks existing ingredients as added", () => {
    const changes = []
    const { CatalogQuoteMixBuilder } = loadComponents({ slots: ["banano", 8] })(directory + "catalogQuoteMixBuilder.component.tsx")
    const tree = CatalogQuoteMixBuilder({ materials, percentages: { 1: "50" }, onChange: (...args) => changes.push(args) })
    const picker = all(tree).find(row => row.props?.id === "catalog-material-results")
    const buttons = all(picker).filter(row => row.type === "button")
    assert.equal(buttons.length, 1)
    buttons[0].props.onClick()
    assert.deepEqual(changes, [[2, "0"]])
    const { CatalogQuoteMixBuilder: NoMatches } = loadComponents({ slots: ["missing", 8] })(directory + "catalogQuoteMixBuilder.component.tsx")
    const html = renderToStaticMarkup(React.createElement(NoMatches, { materials, percentages: {}, onChange: () => {} }))
    assert.ok(html.includes(resources.es.catalogQuote.ui.noMatches))
})

test("name search normalizes case, trim and accents and never expands its compatible input", () => {
    const { searchCatalogMaterials: search } = loadComponents()(directory + "catalogMaterialSearch.ts")
    for (const query of ["Arándano", "ARÁNDANO", "  arandano  ", "ARA\u0301NDANO"]) assert.deepEqual(search(materials, query), [materials[0]])
    assert.deepEqual(search(materials, "banano"), [materials[1]])
    assert.deepEqual(search(materials, "dragon fruit"), [])
    assert.deepEqual(search(materials, "broccoli"), [])
    assert.deepEqual(search(materials, ""), materials)
    assert.deepEqual(search(materials, "   "), materials)
    assert.equal(search(materials, "codigo-interno").length, 0)
})

function mixHarness(rows = materials, initialPercentages = {}) {
    let cursor = 0
    const slots = ["", 8]
    const percentages = { ...initialPercentages }
    const hooks = { useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value }] } }
    const { CatalogQuoteMixBuilder } = loadComponents({ hooks })(directory + "catalogQuoteMixBuilder.component.tsx")
    const render = () => { cursor = 0; return CatalogQuoteMixBuilder({ materials: rows, percentages, onChange: (id, value) => { if (value === undefined) delete percentages[id]; else percentages[id] = value } }) }
    const node = predicate => all(render()).find(predicate)
    const search = value => node(row => row.props?.id === "catalog-material-search").props.onChange({ target: { value } })
    const resultButtons = () => all(node(row => row.props?.id === "catalog-material-results")).filter(row => row.type === "button")
    return { render, node, search, resultButtons, percentages }
}

test("live search, clearing and adding preserve existing percentages and block duplicates", () => {
    const harness = mixHarness(materials, { 1: "49.25" })
    assert.equal(harness.resultButtons().length, 2)
    const added = harness.resultButtons()[0]
    assert.equal(added.props.disabled, true)
    added.props.onClick()
    assert.equal(harness.percentages[1], "49.25")
    harness.search("  BANANO  ")
    assert.equal(harness.resultButtons().length, 1)
    harness.resultButtons()[0].props.onClick()
    assert.deepEqual(harness.percentages, { 1: "49.25", 2: "0" })
    assert.equal(harness.resultButtons()[0].props.disabled, true)
    harness.node(row => row.props?.["aria-label"] === "Limpiar búsqueda").props.onClick()
    assert.equal(harness.resultButtons().length, 2)
    assert.deepEqual(harness.percentages, { 1: "49.25", 2: "0" })
    harness.search("dragon fruit")
    assert.equal(harness.resultButtons().length, 0)
    harness.search("arandano")
    assert.equal(harness.resultButtons()[0].props["aria-label"], "Arándano entero ya está agregada")
})

test("large compatible catalogs show eight initial results, expand and reset on search", () => {
    const rows = Array.from({ length: 120 }, (_, index) => ({ rawMaterialId: index + 1, displayName: `Materia prima ${index + 1}` }))
    const harness = mixHarness(rows)
    assert.equal(harness.resultButtons().length, 8)
    harness.node(row => row.props?.children === "Ver más").props.onClick()
    assert.equal(harness.resultButtons().length, 16)
    harness.search("Materia prima 120")
    assert.equal(harness.resultButtons().length, 1)
    assert.equal(harness.resultButtons()[0].props["aria-label"], "Agregar Materia prima 120")
    harness.search("")
    assert.equal(harness.resultButtons().length, 8)
    assert.deepEqual(harness.percentages, {})
})

test("all seven steps and exceptional states render with translated, accessible controls", () => {
    const state = { categoryId: 1, subCategoryId: 2, ingredientType: "fruit", isOrganic: false, percentages: { 1: "50", 2: "50" }, configurationId: 3, choices: {}, pallets: "2" }
    const fixed = [{ id: 1, packagingId: 1, displayName: "Bolsa del producto", isDefault: true }]
    const configuration = { id: 3, fingerprint: "fixture", presentationId: 1, displayLabel: "48 OZ", netWeightGrams: 1360, bagsPerBox: 6, boxesPerPallet: 117, unitsPerIntermediatePackage: 3, packaging: { unit: { fixed, groups: [] }, intermediate: { fixed: [{ ...fixed[0], displayName: "Empaque intermedio" }], groups: [] }, pallet: { fixed: [], groups: [{ key: "box", group: "Caja", options: [{ ...fixed[0], displayName: "Caja estándar" }, { ...fixed[0], id: 2, isDefault: false, displayName: "Caja alternativa" }] }] } } }
    const query = { data: { categories: [{ id: 1, displayName: "Congelado", subCategories: [{ id: 2, displayName: "Mezclas de frutas", rawMaterials: materials.map(row => ({ ...row, ingredientType: "fruit", isOrganic: false })), configurations: [configuration] }] }] } }
    const review = { input: {}, calculation: { productDisplayName: "Mezcla personalizada", variantLabel: "6 × 48 OZ", bagsPerBox: 6, boxesPerPallet: 117, requestedPallets: 2, totalUnits: 1404, totalCost: 12345.67, configuration: { snapshot: {isOrganic:false, ingredientType:"fruit", quantity:{totalWeightGrams:"1909440"}}, rawMaterialMix: [{ rawMaterialId: 1, percentage: 50 }, { rawMaterialId: 2, percentage: 50 }], pallet: { boxesPerPallet: 117 } }, breakdown: { rawMaterials: materials, unitMaterials: fixed, intermediateMaterials: configuration.packaging.intermediate.fixed, palletMaterials: [{ ...fixed[0], displayName: "Caja estándar" }] } } }
    const screens = []
    for (const language of ["es", "en"]) {
        for (const step of ["category", "subCategory", "profile", "mix", "configuration", "packaging", "result"]) {
            const { CatalogQuoteWizard } = loadComponents({ language, slots: [state, step, null, false, "", {...review.calculation, totalWeightPounds: 4209.5}], query })(directory + "catalogQuoteWizard.component.tsx")
            const html = renderToStaticMarkup(React.createElement(CatalogQuoteWizard, { onConfirmed: () => {} }))
            assert.ok(html.includes('aria-current="step"')); assert.equal((html.match(/class="relative flex min-w-24/g) ?? []).length,7); assert.ok(!html.includes('>Review<')); assert.ok(!html.includes('>Revisi?n<'));
            assert.ok(html.includes(resources[language].catalogQuote.steps[step].replace(/&/g, "&amp;")), `${language} ${step} heading`)
            if (step === "profile") assert.match(html, /disabled=""/)
            if (step === "result") { assert.match(html, /12,345\.67/); assert.ok(html.includes(materials[0].displayName)); assert.ok(html.includes("Empaque intermedio")); assert.ok(!html.includes('>Continuar<')); assert.ok(!html.includes('>Continue<')); assert.ok(!html.includes('>Confirm<')); }
            screens.push({ name: `${language}-${step}`, html })
        }
        for (const [name, percentages] of [["zero", {}], ["under", { 1: "75" }], ["over", { 1: "60", 2: "50" }]]) {
            const { CatalogQuoteWizard } = loadComponents({ language, slots: [{ ...state, percentages }, "mix", null, false, ""], query })(directory + "catalogQuoteWizard.component.tsx")
            const html = renderToStaticMarkup(React.createElement(CatalogQuoteWizard, { onConfirmed: () => {} }))
            assert.match(html, /disabled=""/)
            screens.push({ name: `${language}-mix-${name}`, html })
        }
        const largeMaterials = [...materials, { rawMaterialId: 3, displayName: "Mango en cubos" }, { rawMaterialId: 4, displayName: "Piña en trozos" }, ...Array.from({ length: 116 }, (_, index) => ({ rawMaterialId: index + 5, displayName: `Materia prima de prueba ${index + 5}` }))].map(row => ({ ...row, ingredientType: "fruit", isOrganic: false }))
        const largeQuery = { data: { categories: [{ ...query.data.categories[0], subCategories: [{ ...query.data.categories[0].subCategories[0], rawMaterials: largeMaterials }] }] } }
        for (const [name, percentages, search] of [["empty-search", {}, ""], ["search", { 2: "25" }, "arandano"], ["multiple", { 1: "30", 2: "25", 3: "20" }, ""], ["exact", { 1: "50", 2: "25", 3: "25" }, ""], ["no-results", { 1: "50" }, "dragon fruit"]]) {
            const { CatalogQuoteWizard } = loadComponents({ language, slots: [{ ...state, percentages }, "mix", null, false, "", null, 0, search, 8], query: largeQuery })(directory + "catalogQuoteWizard.component.tsx")
            const html = renderToStaticMarkup(React.createElement(CatalogQuoteWizard, { onConfirmed: () => {} }))
            screens.push({ name: `${language}-mix-${name}`, html })
        }
        for (const [name, currentQuery, error, pending] of [["loading", { isLoading: true }, "", false], ["empty", { data: { categories: [] } }, "", false], ["discovery-error", { isError: true, refetch: () => {} }, "", false], ["preview-error", query, "catalogQuote.previewError", false], ["pending", query, "", true]]) {
            const { CatalogQuoteWizard } = loadComponents({ language, slots: [state, "packaging", null, pending, error], query: currentQuery })(directory + "catalogQuoteWizard.component.tsx")
            screens.push({ name: `${language}-${name}`, html: renderToStaticMarkup(React.createElement(CatalogQuoteWizard, { onConfirmed: () => {} })) })
        }
    }
    if (process.env.CATALOG_UI_ARTIFACTS) {
        const target = path.resolve("artifacts/catalog-ui")
        fs.mkdirSync(target, { recursive: true })
        const cssFile = fs.readdirSync("dist/assets").find(file => /^index-.*\.css$/.test(file))
        assert.ok(cssFile, "Build first to supply production CSS")
        const css = fs.readFileSync(`dist/assets/${cssFile}`, "utf8").replace(/url\(([^)]*)\)/g, (_, url) => `url(../../dist/assets/${url.replace(/^["']|["']$/g, "")})`)
        const header = `<a class="inline-flex min-h-11 items-center gap-2 text-sm text-brand-700" href="#">← ${resources.es.customQuote.page.backToDefined}</a><h1 class="mb-3 mt-5 text-3xl font-bold sm:text-4xl">${resources.es.catalogQuote.title}</h1><p class="mb-8 max-w-2xl text-ink-600">${resources.es.catalogQuote.ui.intro}</p>`
        fs.writeFileSync(path.join(target, "review.html"), `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Customize UI — test fixtures</title><style>${css}</style><main class="mx-auto max-w-site bg-customize-slate px-6 py-12 sm:px-10">${screens.map(screen => `<section data-fixture="${screen.name}" class="mx-auto mb-12 max-w-6xl">${header}${screen.html}</section>`).join("")}</main><script>addEventListener('load',()=>{const failures=[...document.querySelectorAll('[data-fixture]')].filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>el.dataset.fixture);const result=document.createElement('pre');result.id='layout-result';result.textContent=JSON.stringify({width:innerWidth,viewportOverflow:document.documentElement.scrollWidth>innerWidth,failures});document.body.append(result);if(location.hash){document.querySelectorAll('[data-fixture]').forEach(el=>el.hidden=el.dataset.fixture!==location.hash.slice(1))}})</script></html>`)
    }
})
