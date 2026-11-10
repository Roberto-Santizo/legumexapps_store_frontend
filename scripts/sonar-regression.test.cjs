const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")

function loader(overrides = {}) {
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
        vm.runInThisContext(`(function(require,module,exports,requestAnimationFrame,cancelAnimationFrame){${source}\n})`, { filename: file })(localRequire,module,module.exports,overrides.frames?.request,overrides.frames?.cancel)
        return module.exports
    }
    return load
}

const all = tree => !tree || typeof tree !== "object" ? [] : [tree, ...[].concat(tree.props?.children ?? []).flat(Infinity).flatMap(all)]

// Like `all`, but also renders function components (the result card's cost breakdown is one), keeping
// the component element itself so its props stay inspectable.
const rendered = tree => !tree || typeof tree !== "object" ? [] : [tree, ...(typeof tree.type === "function" ? rendered(tree.type(tree.props)) : [].concat(tree.props?.children ?? []).flat(Infinity).flatMap(rendered))]

function loadResultCard() {
    return loader({
        "react-i18next": { useTranslation: () => ({ t: (key, values = {}) => `${key} ${Object.values(values).join(" ")}`, i18n: { language: "es" } }) },
        "@/shared/component/card.component": { Card: "Card" },
        "@/shared/component/spinner.component": { Spinner: "Spinner" },
    })("src/feature/quote/component/quoteResultCard.component.tsx").QuoteResultCard
}

test("product additional charge is visible only in administrator calculations", () => {
    const QuoteResultCard = loadResultCard()
    const result = { requestedPallets: 1, totalUnits: 20, boxesPerPallet: 20, totalCost: 56,
        breakdown: { rawMaterials: [], palletMaterials: [], adjustment: { unitCost: 0.3, totalUnits: 20, lineTotal: 6 } } }
    for (const showCostBreakdown of [true, false]) {
        const nodes = rendered(QuoteResultCard({ result, isPending: false, showCostBreakdown }))
        const sections = nodes.filter(node => node.props.title?.trim() === "site.quoteRequest.result.adjustment")
        assert.equal(sections.length, showCostBreakdown ? 1 : 0)
        if (!showCostBreakdown) continue
        assert.equal(sections[0].props.subtotal, 6)
        const row = all(sections[0]).find(node => node.props.quantityLabel)
        assert.ok(row.props.quantityLabel.includes("0.30"))
        assert.ok(row.props.quantityLabel.includes("20"))
        assert.equal(row.props.lineTotal, 6)
    }
    const nodes = rendered(QuoteResultCard({ result: { ...result, breakdown: { ...result.breakdown, adjustment: null } }, isPending: false, showCostBreakdown: false }))
    assert.ok(!nodes.some(node => node.props.title?.trim() === "site.quoteRequest.result.adjustment"))
})

test("a representative result shows no amount, only that the price is pending management review", () => {
    const QuoteResultCard = loadResultCard()
    // What the representative API returns: no totalCost, no line amounts.
    const result = { requestedPallets: 2, totalUnits: 40, boxesPerPallet: 20,
        breakdown: { rawMaterials: [{ rawMaterialId: 1, displayName: "Piña", quantityPerUnit: 1, totalUnits: 40 }], palletMaterials: [] } }
    for (const showCostBreakdown of [true, false]) {
        const nodes = rendered(QuoteResultCard({ result, isPending: false, showCostBreakdown, showTransport: true }))
        const texts = nodes.flatMap(node => [].concat(node.props?.children ?? [])).filter(child => typeof child === "string" || typeof child === "number").join(" ")
        assert.ok(texts.includes("quote.pendingReview.title"))
        assert.ok(!texts.includes("$"))
        for (const key of ["site.quoteRequest.result.total", "site.quoteRequest.result.perPallet", "site.quoteRequest.result.destination"]) assert.ok(!texts.includes(key), key)
        assert.ok(!nodes.some(node => node.props?.subtotal !== undefined || node.props?.lineTotal !== undefined))
    }
})

test("informational stepper retains list semantics, active step and horizontal scrolling without a tab stop", () => {
    const effects = []
    const { CatalogQuoteStepper } = loader({ react: { useEffect: (callback, dependencies) => effects.push({ callback, dependencies }), useRef: value => ({ current: value }) }, "react-i18next": { useTranslation: () => ({ t: key => key }) }, "@/shared/component/button.component": { Button: "Button" } })("src/shared/component/catalogQuoteUi.component.tsx")
    const nodes = all(CatalogQuoteStepper({ step: "mix" }))
    const list = nodes.find(row => row.type === "ol")
    assert.equal(list.props.tabIndex, undefined)
    assert.ok(list.props.ref)
    assert.ok(list.props.className.includes("overflow-x-auto"))
    assert.equal(nodes.filter(row => row.props["aria-current"] === "step").length, 1)
    assert.equal(nodes.filter(row => row.type === "li").length, 6)
    const circles = nodes.filter(row => row.type === "span" && row.props.className?.includes("relative z-10"))
    assert.ok(circles[0].props.className.includes("bg-brand-700 text-white"))
    const activeClasses = circles[3].props.className.split(" ")
    for (const expected of ["bg-surface", "text-brand-700", "ring-2", "ring-brand-500", "dark:text-brand-500"]) {
        assert.ok(activeClasses.includes(expected), `active step is missing ${expected}`)
    }
    assert.ok(activeClasses.includes("shadow-[0_0_0_6px_var(--color-customize-mint)]"))
    const active = nodes.find(row => row.props["aria-current"] === "step")
    assert.equal(active.key, "mix")
    assert.ok(all(active).includes(circles[3]))
    assert.equal(nodes.some(row => ["button", "a"].includes(row.type)), false)
    assert.ok(circles[4].props.className.includes("bg-canvas text-ink-600"))
    assert.equal(circles.length, 6)
    assert.equal(nodes.find(row => row.type === "nav").props["aria-label"], "catalogQuote.ui.progress")
    const steps = ["category", "subCategory", "presentation", "mix", "packaging", "result"]
    for (const [index, step] of steps.entries()) {
        const tree = all(CatalogQuoteStepper({ step }))
        const items = tree.filter(row => row.type === "li")
        assert.deepEqual(items.map(row => row.key), steps)
        assert.deepEqual(items.filter(row => row.props["aria-current"] === "step").map(row => row.key), [step])
        assert.equal(tree.some(row => row.props.tabIndex !== undefined || ["button", "a"].includes(row.type)), false)
        const ol = tree.find(row => row.type === "ol")
        ol.props.ref.current = {
            scrollLeft: 40, clientWidth: 300, getBoundingClientRect: () => ({ left: 100 }),
            children: steps.map(() => ({ clientWidth: 80, getBoundingClientRect: () => ({ left: 180 }) })),
        }
        assert.equal(effects.length, index + 2)
        assert.deepEqual(effects.at(-1).dependencies, [index])
        effects.at(-1).callback()
        assert.equal(ol.props.ref.current.scrollLeft, 10)
    }
})

test("JuiceForm preserves zero, false and empty defaults while excluding the existing image from submissions", () => {
    let defaults
    const overrides = {
        "./juiceCategorySelect.component": { JuiceCategorySelect: "JuiceCategorySelect" },
        react: { useId: () => "juice-test" },
        "react-i18next": { useTranslation: () => ({ t: key => key }) },
        "react-hook-form": { Controller: "Controller", useForm: options => {
            defaults = options.defaultValues
            return { register: () => ({}), control: {}, handleSubmit: callback => callback, setError() {}, clearErrors() {}, watch() {}, formState: { errors: {} } }
        } },
        "@tanstack/react-query": { useQueryClient: () => ({}), useQuery: () => ({}), useMutation: () => ({ isPending: false }) },
        sonner: { toast: {} },
        "@/feature/client/api/client.api": { getClientsAPI() {} },
        "../api/juice.api": { saveJuiceRow() {} },
        "@/shared/i18n/getFieldErrorMessage": { getFieldErrorMessage() {} },
    }
    for (const [name, exported] of [["formField", "FormField"], ["input", "Input"], ["select", "Select"], ["searchableSelect", "SearchableSelect"], ["imageUploadField", "ImageUploadField"], ["button", "Button"]]) overrides[`@/shared/component/${name}.component`] = { [exported]: exported }
    const { JuiceForm } = loader(overrides)("src/feature/juice/component/juiceForm.component.tsx")
    const fields = [{ name: "price", nullable: true }, { name: "enabled" }, { name: "code" }, { name: "image", kind: "image" }, { name: "inherited", nullable: true }, { name: "required" }, { name: "nullValue", nullable: true }]
    JuiceForm({ fields, schema: {}, responseSchema: {}, path: "/test", row: { price: 0, enabled: false, code: "", image: "existing.png", nullValue: null } })
    assert.deepEqual(defaults, { price: 0, enabled: false, code: "", image: undefined, inherited: null, required: undefined, nullValue: null })
    JuiceForm({ fields, schema: {}, responseSchema: {}, path: "/test" })
    assert.equal(defaults.price, null)
    assert.equal(defaults.enabled, undefined)
    assert.equal(defaults.image, undefined)
})

test("material groups preserve whitespace normalization and original display names", () => {
    const { listMaterialOptionGroups, sortByMaterialOptionGroup } = loader()("src/feature/product/schema/materialOptionGroup.schema.ts")
    const rows = [{ id: 3, optionGroup: "  Shipping\t\n BOX  " }, { id: 1, optionGroup: "shipping   box" }, { id: 2, optionGroup: "SHIPPING\u00a0BOX" }]
    assert.deepEqual(listMaterialOptionGroups(rows), [rows[0].optionGroup])
    assert.deepEqual(sortByMaterialOptionGroup(rows).map(row => row.id), [1, 2, 3])
    assert.deepEqual(rows.map(row => row.id), [3, 1, 2])
    assert.deepEqual(listMaterialOptionGroups([{ optionGroup: "" }, { optionGroup: " \t\n " }]), [""])
})

function pdfHarness() {
    let slots = [], cursor = 0
    const built = [], errors = []
    const react = { useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = value }] } }
    const overrides = {
        react,
        "react-i18next": { useTranslation: () => ({ t: key => key }) },
        "@tanstack/react-query": { useMutation: () => ({ reset() {}, isPending: false }) },
        sonner: { toast: { success() {}, error: value => errors.push(value) } },
        "@react-pdf/renderer": { pdf: document => { built.push(document); return { toBlob: async () => new Blob(["PDF"]) } } },
        "@/feature/quote/component/quotePdfDocument.component": { QuotePdfDocument: "PdfDocument" },
    }
    for (const [name, exported] of [["button", "Button"], ["modal", "Modal"], ["input", "Input"], ["formField", "FormField"]]) overrides[`@/shared/component/${name}.component`] = { [exported]: exported }
    const { QuotePdfButton } = loader(overrides)("src/feature/quote/component/quotePdfButton.component.tsx")
    const date = new Date(2026, 9, 7, 12)
    function render() { cursor = 0; return all(QuotePdfButton({ lines: [{ totalCost: 10 }], quoteDate: date })) }
    function button(label) { return render().find(row => row.type === "Button" && [].concat(row.props.children).includes(label)) }
    return { render, button, built, errors }
}

test("public PDF download keeps normalized names, fallback and quote date", async () => {
    const previousDocument = globalThis.document
    const downloads = []
    globalThis.document = { body: { appendChild() {} }, createElement: () => ({ href: "", download: "", click() { downloads.push(this.download) }, remove() {} }) }
    try {
        for (const [name, expected] of [["Acme", "ACME"], ["  Acme   Foods  ", "ACME_FOODS"], ["__ Acme & Sons!!", "ACME_SONS"], ["!@#$___", "CLIENTE"], ["_".repeat(100000), "CLIENTE"]]) {
            const h = pdfHarness()
            h.button("quote.pdf.button").props.onClick()
            h.render().find(row => row.type === "Input").props.onChange({ target: { value: name } })
            h.button("quote.pdf.modal.continue").props.onClick()
            await h.button("quote.pdf.modal.downloadOption").props.onClick()
            assert.equal(downloads.at(-1), `Cotizacion_${expected}_2026-10-07.pdf`)
            assert.equal(h.built.length, 1)
            assert.equal(h.built[0].props.clientName, name.trim())
            assert.equal(h.built[0].props.showCostBreakdown, false)
            assert.deepEqual(h.errors, [])
        }
    } finally {
        if (previousDocument === undefined) delete globalThis.document
        else globalThis.document = previousDocument
    }
})

test("public PDF modal rejects empty or whitespace-only names without generating a file", () => {
    for (const name of ["", " \t\n "]) {
        const h = pdfHarness()
        h.button("quote.pdf.button").props.onClick()
        h.render().find(row => row.type === "Input").props.onChange({ target: { value: name } })
        h.button("quote.pdf.modal.continue").props.onClick()
        assert.equal(h.render().find(row => row.type === "FormField").props.error, "quote.pdf.modal.required")
        assert.equal(h.button("quote.pdf.modal.downloadOption"), undefined)
        assert.equal(h.built.length, 0)
    }
})

test("administrator breakdown shows effective unit and box label consumption with independent costs", () => {
    const QuoteResultCard = loadResultCard()
    const result = { requestedPallets: 5, totalUnits: 4800, boxesPerPallet: 80, totalCost: 232, unitPackagingCost: 192, palletMaterialCost: 40,
        breakdown: { rawMaterials: [], unitMaterials: [{ packagingId: 1, displayName: "Individual label", optionGroup: null, quantityPerUnit: 2, totalUnits: 4800, unitCost: 0.02, lineTotal: 192 }],
            palletMaterials: [{ packagingId: 2, displayName: "Box label", optionGroup: null, quantityPerPallet: 160, requestedPallets: 5, unitCost: 0.05, lineTotal: 40 }] } }
    const before = JSON.stringify(result)
    const rows = rendered(QuoteResultCard({ result, isPending: false })).filter(node => node.props.quantityLabel?.includes("site.quoteRequest.result.materialQuantity"))
    assert.ok(rows.some(node => node.props.quantityLabel.includes("9600") && node.props.lineTotal === 192))
    assert.ok(rows.some(node => node.props.quantityLabel.includes("800") && node.props.lineTotal === 40))
    assert.equal(JSON.stringify(result), before)
})
