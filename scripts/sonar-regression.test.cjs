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

test("informational stepper retains list semantics, active step and horizontal scrolling without a tab stop", () => {
    const { CatalogQuoteStepper } = loader({ react: { useEffect() {}, useRef: value => ({ current: value }) }, "react-i18next": { useTranslation: () => ({ t: key => key }) }, "@/shared/component/button.component": { Button: "Button" } })("src/feature/customQuote/component/catalogQuoteUi.component.tsx")
    const nodes = all(CatalogQuoteStepper({ step: "mix" }))
    const list = nodes.find(row => row.type === "ol")
    assert.equal(list.props.tabIndex, undefined)
    assert.ok(list.props.ref)
    assert.ok(list.props.className.includes("overflow-x-auto"))
    assert.equal(nodes.filter(row => row.props["aria-current"] === "step").length, 1)
    assert.equal(nodes.filter(row => row.type === "li").length, 7)
    const circles = nodes.filter(row => row.type === "span" && row.props.className?.includes("relative z-10"))
    assert.ok(circles[0].props.className.includes("bg-brand-700 text-white"))
    assert.ok(circles[3].props.className.includes("bg-dorado text-brand-900"))
    assert.ok(circles[4].props.className.includes("bg-canvas text-ink-600"))
})

test("JuiceForm preserves zero, false and empty defaults while excluding the existing image from submissions", () => {
    let defaults
    const overrides = {
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
