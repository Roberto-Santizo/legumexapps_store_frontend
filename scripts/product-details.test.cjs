const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")
const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")
const { fixedProduct } = require("./fixtures/product-details.cjs")
const resources = { es: require("../src/shared/i18n/locales/es/translation.json"), en: require("../src/shared/i18n/locales/en/translation.json") }
const all = tree => !tree || typeof tree !== "object" ? [] : [tree, ...[].concat(tree.props?.children ?? []).flat(Infinity).flatMap(all)]

function harness({ language = "es", query, permissions = ["products:view"], api = {} } = {}) {
    const slots = [], queryOptions = []
    let cursor = 0
    const t = (key, params = {}) => {
        const value = key.split(".").reduce((item, key) => item?.[key], resources[language])
        assert.equal(typeof value, "string", `Missing translation ${language}:${key}`)
        return value.replace(/{{(\w+)}}/g, (_, key) => params[key] ?? "")
    }
    const overrides = {
        react: { ...React, useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = value }] } },
        "react-i18next": { useTranslation: () => ({ t, i18n: { language } }) },
        "@tanstack/react-query": { useQuery: options => { queryOptions.push(options); return query } },
        "@/shared/component/modal.component": { Modal: "Modal" },
        "@/shared/component/paginatedAdminTable.component": { PaginatedAdminTable: "PaginatedAdminTable" },
        "@/shared/component/editLink.component": { EditLink: "EditLink" },
        "@/shared/component/statusToggleButton.component": { StatusToggleButton: "StatusToggleButton" },
        "@/shared/hook/useStatusToggle": { useStatusToggle: () => ({ isPending: false, toggle() {} }) },
        "@/shared/auth/usePermission": { usePermission: () => ({ hasPermission: permission => permissions.includes(permission) }) },
        "../api/product.api": api,
        "@/feature/product/api/product.api": api,
    }
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
    const component = load("src/feature/product/component/productDetails.component.tsx")
    return { component, load, queryOptions, begin: () => { cursor = 0 }, render: (product = fixedProduct) => { cursor = 0; return component.ProductDetailsContent({ product }) } }
}

test("fixed product detail renders real names, material codes, percentages and reference quantities in both languages", () => {
    for (const language of ["es", "en"]) {
        const h = harness({ language })
        const original = JSON.stringify(fixedProduct)
        const html = renderToStaticMarkup(h.render())
        assert.ok(html.includes(fixedProduct.displayName))
        assert.ok(html.includes(fixedProduct.productRawMaterials[0].usedRawMaterial.code))
        assert.equal((html.match(/role="progressbar"/g) ?? []).length, 2)
        assert.ok(html.includes('aria-valuenow="60"'))
        assert.ok(html.includes("TEST-BAG-40"))
        assert.ok(!html.includes("TEST-INTERMEDIATE-44"))
        assert.ok(!html.includes("TEST-BOTTLE-42"))
        assert.ok(html.includes(language === "es" ? "Inactivo" : "Inactive"))
        assert.ok(!html.includes("<form"))
        assert.ok(!html.includes("<input"))
        assert.equal(JSON.stringify(fixedProduct), original)
    }
})
test("switching presentation replaces SKU, logistics and all packaging levels without mixing variants", () => {
    const h = harness()
    const select = all(h.render()).find(node => node.type === "select")
    select.props.onChange({ target: { value: "11" } })
    const html = renderToStaticMarkup(h.render())
    assert.ok(html.includes("TEST-BOTTLE-42"))
    assert.ok(html.includes("TEST-INTERMEDIATE-44"))
    assert.ok(html.includes("TEST-EXPORT-45"))
    assert.ok(html.includes("0,25 por caja"))
    assert.ok(html.includes("Asociación inactiva"))
    assert.ok(!html.includes("TEST-BAG-40"))
    assert.ok(!html.includes("TEST-PALLET-41"))
})
test("single presentation and absent optional data have explicit empty states without fake materials", () => {
    const product = structuredClone(fixedProduct)
    Object.assign(product, { imageUrl: null, additionalCostPerUnit: null, client: null, parentSubCategory: null, productRawMaterials: [], productIngredients: [], productVariants: [] })
    const h = harness()
    const empty = renderToStaticMarkup(h.render(product))
    assert.ok(empty.includes("Todavía no hay presentaciones"))
    assert.ok(empty.includes("No hay materias primas"))
    assert.ok(!empty.includes("<img"))
    product.productVariants = [{ ...fixedProduct.productVariants[0], sizePresentation: null, unitMaterials: [], palletMaterials: [] }]
    const single = renderToStaticMarkup(h.render(product))
    assert.ok(!single.includes("<select"))
    assert.ok(single.includes("No hay materiales de empaque"))
})
test("orphaned materials and null percentages remain unknown, not zero or generated codes", () => {
    const product = structuredClone(fixedProduct)
    product.productRawMaterials = [{ id: 2, isActive: false, percentage: null, usedRawMaterial: null }]
    const html = renderToStaticMarkup(harness().render(product))
    assert.ok(html.includes("Material no disponible"))
    assert.ok(html.includes("No registrado"))
    assert.ok(!html.includes('role="progressbar"'))
    assert.ok(!html.includes("undefined"))
})
test("modal supports loading, errors, retry and a dedicated read-only scoped query", async () => {
    let retries = 0
    for (const state of ["loading", "error", "success"]) {
        const h = harness({ query: { isPending: state === "loading", isError: state === "error", data: state === "success" ? { data: fixedProduct } : undefined, refetch: () => { retries++ } }, api: { getFixedProductDetailsAPI: async id => ({ id }) } })
        const modal = h.component.ProductDetailsModal({ productId: 1, onClose() {} })
        assert.equal(modal.props.size, "wide")
        assert.equal(modal.props.scrollBody, true)
        assert.deepEqual(h.queryOptions[0].queryKey, ["fixedProductDetails", 1])
        assert.deepEqual(await h.queryOptions[0].queryFn(), { id: 1 })
        if (state === "loading") assert.ok(all(modal).some(node => node.props.role === "status"))
        if (state === "error") {
            assert.ok(all(modal).some(node => node.props.role === "alert"))
            all(modal).find(node => node.props.onClick).props.onClick()
        }
    }
    assert.equal(retries, 1)
})
test("Eye action is fixed-product/admin-only and opening details keeps the list mounted", () => {
    const h = harness()
    const { ProductTable } = h.load("src/feature/product/component/productTable.component.tsx")
    const render = () => { h.begin(); return all(ProductTable()) }
    let table = render().find(node => node.type === "PaginatedAdminTable")
    assert.deepEqual(table.props.queryKey, ["products", "paginated"])
    const actions = table.props.renderActions({ id: 1, displayName: "Name", isActive: false, isCustomizable: false })
    all(actions).find(node => node.type === "button").props.onClick()
    const opened = render()
    assert.ok(opened.some(node => node.type === "PaginatedAdminTable"))
    const modal = opened.find(node => node.props.productId === 1)
    assert.ok(modal)
    modal.props.onClose()
    assert.ok(!render().some(node => node.props.productId === 1))
    assert.ok(!all(table.props.renderActions({ isCustomizable: true })).some(node => node.type === "button"))
    const forbidden = harness({ permissions: [] })
    table = all(forbidden.load("src/feature/product/component/productTable.component.tsx").ProductTable()).find(node => node.type === "PaginatedAdminTable")
    assert.ok(!all(table.props.renderActions({ isCustomizable: false })).some(node => node.type === "button"))
})
test("details schema preserves null quantities and accepts PostgreSQL decimal strings", () => {
    const h = harness()
    const { productDetailsSchema } = h.load("src/feature/product/schema/productDetails.schema.ts")
    const input = structuredClone(fixedProduct)
    input.productRawMaterials[0].percentage = "60.00"
    input.productVariants[0].boxesPerPallet = null
    const parsed = productDetailsSchema.parse(input)
    assert.equal(parsed.productRawMaterials[0].percentage, 60)
    assert.equal(parsed.productVariants[0].boxesPerPallet, null)
})
test("new translations have matching interpolation and keys", () => {
    function verify(es, en) {
        assert.deepEqual(Object.keys(es), Object.keys(en))
        for (const key of Object.keys(es)) {
            if (typeof es[key] === "object") verify(es[key], en[key])
            else assert.deepEqual(es[key].match(/{{\w+}}/g), en[key].match(/{{\w+}}/g))
        }
    }
    verify(resources.es.productDetails, resources.en.productDetails)
})
