const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")
const React = require("react")

async function modules() {
    const renderer = await import("@react-pdf/renderer")
    const messages = JSON.parse(fs.readFileSync("src/shared/i18n/locales/en/translation.json", "utf8"))
    const spanish = JSON.parse(fs.readFileSync("src/shared/i18n/locales/es/translation.json", "utf8"))
    const i18next = require("i18next").createInstance()
    await i18next.init({ lng: "en", resources: { en: { translation: messages }, es: { translation: spanish } }, interpolation: { escapeValue: false } })
    const cache = new Map()
    function load(file) {
        file = path.resolve(file)
        if (cache.has(file)) return cache.get(file).exports
        const module = { exports: {} }; cache.set(file, module)
        const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
        const localRequire = name => {
            if (name === "@react-pdf/renderer") return { ...renderer, Image: props => React.createElement(renderer.Image, { ...props, src: props.src === "/logo-legumex.png" ? fs.readFileSync("public/logo-legumex.png") : props.src }) }
            if (name === "react-i18next") return { useTranslation: () => ({ t: i18next.t.bind(i18next), i18n: i18next }) }
            if (name.startsWith("@/") || name.startsWith(".")) {
                const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(file), name)
                return load([`${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate)))
            }
            return require(name)
        }
        vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(localRequire, module, module.exports)
        return module.exports
    }
    return { renderer, load, i18next }
}
const setup = modules()
const pouch = { displayName: "Bolsa GV Fruit Salad Blend 48 oz", optionGroup: "BOLSAS (BAGS)" }
const box = { displayName: "Caja Fruit Salad Blend 6x48 oz", optionGroup: "CAJAS (BOX)" }
const inner = { displayName: "Inner master pouch for six retail units", optionGroup: null }

function mixedOrderFixture() {
    const base = { destinationId: null, productDisplayName: "Fixed pineapple", variantLabel: "6 x 48 OZ", requestedPallets: 2, totalUnits: 720, boxesPerPallet: 60,
        rawMaterialCost: 1800, unitPackagingCost: 100, intermediatePackagingCost: 12, palletMaterialCost: 100, transportCost: 0, totalCost: 2012,
        breakdown: { production: { productId: 5, skuCode: "PTC3010111", kind: "fixed", boxesPerPallet: 60, bagsPerBox: 6, netWeightGrams: 1360 },
            rawMaterials: [{ rawMaterialId: 1, code: "MP001", displayName: "Pineapple", percentage: 100, gramsPerUnit: 1360, quantityPerUnit: 1.36, totalUnits: 720, unitCost: 1, lineTotal: 1800 }],
            ingredients: [], unitMaterials: [{ ...pouch, code: "EMP001", quantityPerUnit: 1, totalUnits: 720 }], intermediateMaterials: [{ ...inner, code: "EMP002", packagesNeeded: 120 }],
            palletMaterials: [{ ...box, code: "EMP003", quantityPerPallet: 60, requestedPallets: 2 }], transport: { destinationId: null, displayName: "", baseCost: 0 } } }
    const custom = { ...base, productDisplayName: "Custom tropical blend", requestedPallets: 1, totalUnits: 360, totalCost: 1006,
        composition: { rawMaterials: [{ displayName: "Pineapple", percentage: 100 }], ingredients: [] },
        breakdown: { ...base.breakdown, production: { kind: "customizable", boxesPerPallet: 60, bagsPerBox: 6, netWeightGrams: 1360 },
            rawMaterials: [{ ...base.breakdown.rawMaterials[0], totalUnits: 360 }], intermediateMaterials: [{ ...inner, code: "EMP002", packagesNeeded: 60 }] } }
    return [base, custom]
}

test("mixed orders consolidate physical quantities and keep missing historical quantities unknown", async () => {
    const { load } = await setup
    const { productionMaterials, consolidateProductionMaterials } = load("src/feature/quote/component/quoteProductionData.ts")
    const lines = mixedOrderFixture()
    const before = JSON.stringify(lines)
    const totals = consolidateProductionMaterials(lines)
    assert.ok(Math.abs(totals.find(row => row.code === "MP001").quantity - 1468.8) < 1e-9)
    assert.equal(totals.find(row => row.code === "EMP001").quantity, 1080)
    assert.equal(totals.find(row => row.code === "EMP002").quantity, 180)
    assert.equal(totals.find(row => row.code === "EMP003").quantity, 180)
    const legacy = { ...lines[0], breakdown: { ...lines[0].breakdown, rawMaterials: [{ displayName: "Historical material", quantityPerUnit: 50 }] } }
    assert.equal(productionMaterials(legacy).raw[0].quantity, null)
    assert.equal(JSON.stringify(lines), before)
    const sameCodeDifferentCatalog = { ...lines[0], breakdown: { ...lines[0].breakdown, unitMaterials: [{ ...pouch, code: "MP001", quantityPerUnit: 1 }] } }
    assert.equal(consolidateProductionMaterials([sameCodeDifferentCatalog]).filter(row => row.code === "MP001").length, 2)
})

test("renders both mixed customer PDF and printable production report with all material levels", async () => {
    const { renderer, load, i18next } = await setup
    const { QuotePdfDocument } = load("src/feature/quote/component/quotePdfDocument.component.tsx")
    const { QuoteProductionDocument } = load("src/feature/quote/component/quoteProductionDocument.component.tsx")
    const lines = mixedOrderFixture()
    const props = { lines, clientName: "Mixed order customer", orderId: "PEDIDO-MIXTO-DEMO", salespersonName: "Representative", quoteDate: new Date("2026-10-08T12:00:00Z") }
    const output = path.resolve("artifacts/quote-production")
    fs.mkdirSync(output, { recursive: true })
    await renderer.renderToFile(React.createElement(QuotePdfDocument, { ...props, showCostBreakdown: false }), path.join(output, "mixed-customer.pdf"))
    await renderer.renderToFile(React.createElement(QuoteProductionDocument, props), path.join(output, "mixed-production.pdf"))
    await i18next.changeLanguage("es")
    try { await renderer.renderToFile(React.createElement(QuoteProductionDocument, props), path.join(output, "mixed-production-es.pdf")) }
    finally { await i18next.changeLanguage("en") }
    for (const file of ["mixed-customer.pdf", "mixed-production.pdf"]) assert.match(fs.readFileSync(path.join(output, file)).subarray(0, 5).toString(), /^%PDF-/)
})

test("PDF presentation uses structured types, omits unused levels and never mutates snapshots", async () => {
    const { load } = await setup
    const { buildPdfPackagingMaterials: build } = load("src/feature/quote/component/quotePdfPackaging.ts")
    const snapshot = Object.freeze({ unitMaterials: Object.freeze([Object.freeze(pouch)]), palletMaterials: Object.freeze([Object.freeze(box)]) })
    assert.deepEqual(build(snapshot), [{ name: pouch.displayName, kind: "unit" }, { name: box.displayName, kind: "other" }])
    assert.deepEqual(build({}), [])
    const kinds = ["CAJA", "ESQUINERO", "TARIMA", "STRETCH", "OTRO PALETIZACIÓN", "unknown"].map(materialType => ({ displayName: "Same commercial name", materialType }))
    assert.deepEqual(build({ palletMaterials: kinds }).map(item => item.kind), ["box", "corner", "pallet", "stretch", "other", "other"])
})

test("confirmed customizable snapshots render commercial composition and certification without source identity", async () => {
    const { renderer, load } = await setup
    const { QuotePdfDocument } = load("src/feature/quote/component/quotePdfDocument.component.tsx")
    const { toCustomQuoteDocumentLine } = load("src/feature/customQuote/component/customQuoteComposition.ts")
    const output = path.resolve("artifacts/quote-packaging")
    fs.mkdirSync(output, { recursive: true })
    for (const isOrganic of [false, true]) {
        const confirmed = {
            id: 88, status: "new", productDisplayName: "CUSTOM FRUIT BLEND", variantLabel: "6 × 48 OZ", requestedPallets: 2, totalUnits: 720, boxesPerPallet: 60,
            rawMaterialCost: 1800, ingredientCost: 0, unitPackagingCost: 100, intermediatePackagingCost: 0, palletMaterialCost: 100, processingCostTotal: 0, percentageCostTotal: 0, transportCost: 0, adjustmentCost: 0, totalCost: 2000,
            configuration: { rawMaterialMix: [{ rawMaterialId: 1, percentage: 50 }, { rawMaterialId: 2, percentage: 30 }, { rawMaterialId: 3, percentage: 20 }], snapshot: {
                category: { displayName: "Frozen" }, subCategory: { displayName: "Fruit blends" }, isOrganic, ingredientType: "fruit",
                source: { skuCode: "PRIVATE-SKU", productVariantId: 5 },
            } },
            breakdown: { rawMaterials: [{ rawMaterialId: 1, displayName: "Strawberry" }, { rawMaterialId: 2, displayName: "Mango" }, { rawMaterialId: 3, displayName: "Pineapple" }], ingredients: [], unitMaterials: [pouch], palletMaterials: [box], transport: { destinationId: null, displayName: "", baseCost: 0 } },
        }
        const before = JSON.stringify(confirmed)
        const documentLine = toCustomQuoteDocumentLine(confirmed)
        assert.equal(documentLine.composition.context.isOrganic, isOrganic)
        await renderer.renderToFile(React.createElement(QuotePdfDocument, { clientName: "Confirmed quote review", quoteDate: new Date("2026-10-07T12:00:00Z"), lines: [documentLine], showCostBreakdown: false }), path.join(output, `custom-mix-${isOrganic ? "organic" : "conventional"}.pdf`))
        assert.equal(JSON.stringify(confirmed), before)
    }
})

test("renders complete quote PDFs for 1, 2, 3 and 7 materials, including long names", async () => {
    const { renderer, load } = await setup
    const { QuotePdfDocument } = load("src/feature/quote/component/quotePdfDocument.component.tsx")
    const output = path.resolve("artifacts/quote-packaging")
    fs.mkdirSync(output, { recursive: true })
    const cases = {
        "packaging-1": { unitMaterials: [pouch], palletMaterials: [] },
        "fruit-salad-2": { unitMaterials: [pouch], palletMaterials: [box] },
        "packaging-3": { unitMaterials: [pouch], intermediateMaterials: [inner], palletMaterials: [{ ...box, materialType: "CAJA" }] },
        "packaging-7-long": { unitMaterials: [{ ...pouch, displayName: `${pouch.displayName} — premium resealable food-safe pouch for international retail distribution` }], intermediateMaterials: [inner], palletMaterials: [
            { ...box, materialType: "CAJA" },
            { displayName: "Wood pallet for international distribution", materialType: "TARIMA" },
            { displayName: "Reinforced cardboard corner protectors", materialType: "ESQUINERO" },
            { displayName: "Clear stretch wrap roll for secure transport", materialType: "STRETCH" },
            { displayName: "Logistics".repeat(30), materialType: "OTRO PALETIZACIÓN" },
        ] },
    }
    cases["packaging-5"] = { unitMaterials: [pouch], intermediateMaterials: [inner], palletMaterials: [
        { ...box, materialType: "CAJA" },
        { displayName: "Wood pallet for international distribution", materialType: "TARIMA" },
        { displayName: "Clear stretch wrap roll for secure transport", materialType: "STRETCH" },
    ] }
    for (const [name, materials] of Object.entries(cases)) {
        const line = { productDisplayName: "Fruit Salad Blend", variantLabel: "6 × 48 oz", requestedPallets: 2, totalUnits: 720, boxesPerPallet: 60,
            rawMaterialCost: 1800, unitPackagingCost: 100, intermediatePackagingCost: 0, palletMaterialCost: 100, transportCost: 0, totalCost: 2000,
            breakdown: { rawMaterials: [], transport: { destinationId: null, displayName: "", baseCost: 0 }, ...materials } }
        const before = JSON.stringify(line)
        await renderer.renderToFile(React.createElement(QuotePdfDocument, { clientName: "Packaging design review", quoteDate: new Date("2026-10-07T12:00:00Z"), lines: [line], showCostBreakdown: false }), path.join(output, `${name}.pdf`))
        assert.equal(JSON.stringify(line), before)
        assert.match(fs.readFileSync(path.join(output, `${name}.pdf`)).subarray(0, 5).toString(), /^%PDF-/)
    }
})
