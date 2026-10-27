const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")

// Same approach as the other script tests: transpile the real TS/TSX module, replace hooks and leaf
// components by name, and inspect the returned React element tree (no DOM, no test renderer).
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
        vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(localRequire, module, module.exports)
        return module.exports
    }
    return load
}

const all = tree => !tree || typeof tree !== "object" ? [] : [tree, ...[].concat(tree.props?.children ?? []).flat(Infinity).flatMap(all)]
const text = node => all(node).length === 0 && typeof node !== "object" ? String(node) : [].concat(node?.props?.children ?? []).flat(Infinity).map(child => typeof child === "object" && child ? text(child) : String(child ?? "")).join("")
const t = (key, options) => options ? `${key}${JSON.stringify(options)}` : key
const i18n = { "react-i18next": { useTranslation: () => ({ t }) } }
const stubs = names => Object.fromEntries(names.map(([module, exported]) => [`@/shared/component/${module}.component`, { [exported]: exported }]))

function stateHarness() {
    const slots = []
    let cursor = 0
    return {
        slots,
        begin() { cursor = 0 },
        useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = value }] },
    }
}

// JuiceForm and JuiceSection delegate the recipe total to JuiceMixTotal; render it to reach its <output>.
const mixOutput = nodes => {
    const element = nodes.find(node => typeof node.type === "function" && node.type.name === "JuiceMixTotal")
    return element && all(element.type(element.props)).find(node => node.type === "output")
}

const juiceFieldsModule = () => loader()("src/feature/juice/constant/juiceFields.ts")

function juiceConfigurationHarness(permissions = ["products:view", "products:edit"]) {
    const writes = [], invalidations = [], resets = []
    const product = { subCategoryId: 3, clientId: 4, displayName: "Synthetic juice", isOrganic: false, imageUrl: null, translations: [] }
    const components = ["ProductForm", "ProductVariantSection", "ProductVariantUnitMaterialSection", "ProductVariantIntermediateMaterialSection", "ProductVariantPalletMaterialSection"]
    const overrides = {
        ...i18n,
        react: { ...require("react"), useEffect: fn => fn() },
        "@/shared/auth/usePermission": { usePermission: () => ({ hasPermission: key => permissions.includes(key) }) },
        "@/feature/product/api/product.api": { getProductByIdAPI() {}, updateProductAPI: async (...args) => { writes.push(args); return { message: "saved" } } },
        "react-hook-form": { useForm: () => ({ register() {}, control: {}, reset: value => resets.push(value), handleSubmit: fn => () => fn({ displayName: "Updated synthetic juice" }), formState: { errors: {} } }) },
        "@tanstack/react-query": {
            useQuery: () => ({ data: { data: product }, isLoading: false, isError: false }),
            useQueryClient: () => ({ invalidateQueries: options => invalidations.push(options) }),
            useMutation: options => ({ isPending: false, mutate: async value => { options.onSuccess(await options.mutationFn(value)) } }),
        },
        sonner: { toast: { success() {} } },
        "@/shared/i18n/showErrorToast": { showErrorToast() {} },
        ...stubs([["card", "Card"], ["button", "Button"]]),
    }
    for (const component of components) {
        const filename = component[0].toLowerCase() + component.slice(1)
        overrides[`@/feature/product/component/${filename}.component`] = { [component]: component }
    }
    return { ...loader(overrides)("src/feature/juice/component/juiceProductConfiguration.component.tsx"), writes, invalidations, resets }
}

test("juice editor embeds shared variants and every packaging level for its linked product", () => {
    const { JuiceProductConfiguration } = juiceConfigurationHarness()
    const nodes = all(JuiceProductConfiguration({ productId: 8 }))
    for (const type of ["ProductVariantSection", "ProductVariantUnitMaterialSection", "ProductVariantIntermediateMaterialSection", "ProductVariantPalletMaterialSection"]) {
        assert.equal(nodes.find(node => node.type === type).props.productId, 8)
    }
    assert.equal(nodes.some(node => node.props?.to?.startsWith("/admin/products")), false)
    for (const props of [{ productId: 8, readOnly: true }]) {
        assert.equal(all(JuiceProductConfiguration(props)).some(node => node.type === "ProductVariantSection"), false)
    }
    const limited = juiceConfigurationHarness(["products:view"])
    assert.equal(all(limited.JuiceProductConfiguration({ productId: 8 })).some(node => node.type === "ProductVariantSection"), false)
})

test("commercial juice details save in place and readonly mode cannot submit", async () => {
    const harness = juiceConfigurationHarness()
    const nodes = all(harness.JuiceProductIdentity({ productId: 8, readOnly: false }))
    assert.equal(nodes.find(node => node.type === "ProductForm").props.directCostsOnly, true)
    nodes.find(node => node.type === "form").props.onSubmit()
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(harness.writes, [[8, { displayName: "Updated synthetic juice" }]])
    assert.ok(harness.invalidations.some(row => row.queryKey[0] === "quoteProducts"))
    const readonly = all(harness.JuiceProductIdentity({ productId: 8, readOnly: true }))
    assert.equal(readonly.find(node => node.type === "fieldset").props.disabled, true)
    readonly.find(node => node.type === "form").props.onSubmit()
    assert.equal(harness.writes.length, 1)
})

test("juice category selection filters active subcategories and clears the previous choice", () => {
    const state = stateHarness(), selected = []
    const load = loader({
        ...i18n,
        react: { ...require("react"), useState: state.useState },
        "@/feature/category/api/category.api": { getCategoriesAPI() {} },
        "@/feature/category/api/subCategory.api": { getSubCategoriesAPI() {} },
        "@tanstack/react-query": { useQuery: ({ queryKey }) => ({ data: { data: queryKey[0] === "categories" ? [
            { id: 1, displayName: "Synthetic category", isActive: true }, { id: 2, displayName: "Inactive", isActive: false },
        ] : [
            { id: 3, categoryId: 1, displayName: "Synthetic subcategory", isActive: true },
            { id: 4, categoryId: 2, displayName: "Other parent", isActive: true },
            { id: 5, categoryId: 1, displayName: "Inactive subcategory", isActive: false },
        ] }, isLoading: false, isError: false }) },
        ...stubs([["formField", "FormField"], ["searchableSelect", "SearchableSelect"]]),
    })
    const { JuiceCategorySelect } = load("src/feature/juice/component/juiceCategorySelect.component.tsx")
    state.begin()
    let selects = all(JuiceCategorySelect({ inputId: "test", onChange: id => selected.push(id) })).filter(node => node.type === "SearchableSelect")
    assert.deepEqual(selects[0].props.options.map(row => row.value), [1])
    assert.equal(selects[1].props.isDisabled, true)
    selects[0].props.onChange({ value: 1 })
    assert.deepEqual(selected, [undefined])
    state.begin()
    selects = all(JuiceCategorySelect({ inputId: "test", onChange: id => selected.push(id) })).filter(node => node.type === "SearchableSelect")
    assert.deepEqual(selects[1].props.options.map(row => row.value), [3])
    selects[1].props.onChange({ value: 3 })
    assert.deepEqual(selected, [undefined, 3])
})

test("juice recipe ingredients reference the existing ingredient catalog", () => {
    const { spicesResource } = juiceFieldsModule()
    assert.equal(spicesResource.referencePath, "/ingredients")
    assert.equal(spicesResource.referenceName, "ingredientId")
})

test("juice product linking requires both permissions and an explicit subcategory", async () => {
    const state = stateHarness()
    const saved = [], invalidated = []
    let permissions = ["juices:edit"]
    const load = loader({
        ...i18n,
        react: { ...require("react"), useState: state.useState },
        "react-router-dom": { Link: "Link" },
        "@/shared/auth/usePermission": { usePermission: () => ({ hasPermission: key => permissions.includes(key) }) },
        "./juiceCategorySelect.component": { JuiceCategorySelect: "JuiceCategorySelect" },
        "@/shared/component/button.component": { Button: "Button" },
        "../api/juice.api": { saveJuiceRow: async (...args) => { saved.push(args); return { data: { productId: 8, juiceId: 1 } } } },
        "@tanstack/react-query": {
            useQueryClient: () => ({ invalidateQueries: options => invalidated.push(options) }),
            useMutation: options => ({ isPending: false, mutate: async () => { await options.mutationFn(); options.onSuccess() } }),
        },
    })
    const { JuiceProductLink } = load("src/feature/juice/component/juiceProductLink.component.tsx")
    state.begin()
    assert.equal(all(JuiceProductLink({ juiceId: 1 })).some(node => node.type === "Button"), false)
    permissions = ["juices:edit", "products:create"]
    state.begin()
    let tree = all(JuiceProductLink({ juiceId: 1 }))
    assert.equal(tree.find(node => node.type === "Button").props.disabled, true)
    tree.find(node => node.type === "JuiceCategorySelect").props.onChange(3)
    state.begin()
    tree = all(JuiceProductLink({ juiceId: 1 }))
    assert.equal(tree.find(node => node.type === "Button").props.disabled, false)
    await tree.find(node => node.type === "Button").props.onClick()
    assert.equal(saved[0][0], "/admin/juices/1/product")
    assert.deepEqual(saved[0][2], { subCategoryId: 3 })
    assert.equal(invalidated.length, 2)
    permissions = ["products:edit"]
    state.begin()
    tree = all(JuiceProductLink({ juiceId: 1, productId: 8 }))
    assert.equal(tree.some(node => node.type === "Link"), false)
    assert.equal(tree.some(node => node.type === "JuiceCategorySelect"), false)
})

test("juice cell values never render object stringification", () => {
    const { formatJuiceCellValue, juiceRowLabel } = loader()("src/feature/juice/util/juiceSectionRows.ts")
    assert.equal(formatJuiceCellValue("LIBRA"), "LIBRA")
    assert.equal(formatJuiceCellValue(""), "")
    assert.equal(formatJuiceCellValue(0), "0")
    assert.equal(formatJuiceCellValue(2.025852), "2.025852")
    assert.equal(formatJuiceCellValue(false), "false")
    assert.equal(formatJuiceCellValue(null), "—")
    assert.equal(formatJuiceCellValue(undefined), "—")
    for (const value of [{ a: 1 }, [1, 2], new Date(0)]) assert.equal(formatJuiceCellValue(value), "—")
    assert.equal(juiceRowLabel({ id: 1, displayName: "Orange", displayLabel: "6x354" }, "Fallback"), "Orange")
    assert.equal(juiceRowLabel({ id: 1, displayLabel: "6x354" }, "Fallback"), "6x354")
    assert.equal(juiceRowLabel({ id: 1, displayName: { es: "x" }, displayLabel: null }, "Fallback"), "Fallback")
})

test("juice editor decisions keep title, path and recipe base", () => {
    const { juiceEditorTitleKey, juiceRowPath, recipeMixBaseUnits, buildReferenceOptions } = loader()("src/feature/juice/util/juiceSectionRows.ts")
    const { mixResource, presentationsResource } = juiceFieldsModule()
    const row = { id: 4, isActive: true, percentage: 42.123456 }
    assert.equal(juiceEditorTitleKey(true, row), "juice.viewDetails")
    assert.equal(juiceEditorTitleKey(true, undefined), "juice.viewDetails")
    assert.equal(juiceEditorTitleKey(false, row), "common.edit")
    assert.equal(juiceEditorTitleKey(false, undefined), "juice.add")
    assert.equal(juiceRowPath(mixResource, undefined), "/admin/juices/mix")
    assert.equal(juiceRowPath(mixResource, row), "/admin/juices/mix/4")
    assert.equal(recipeMixBaseUnits(presentationsResource, 100000000, row), undefined)
    assert.equal(recipeMixBaseUnits(mixResource, 100000000, row), 100000000 - 42123456)
    assert.equal(recipeMixBaseUnits(mixResource, 100000000, { ...row, isActive: false }), 100000000)
    assert.equal(recipeMixBaseUnits(mixResource, 60000000, undefined), 60000000)
    const references = [{ id: 10, code: "OR", displayName: "Orange", isActive: true }, { id: 11, code: "PI", displayName: "Pineapple", isActive: true }, { id: 12, code: "CA", displayName: "Carrot", isActive: false }]
    assert.deepEqual(buildReferenceOptions(references, [{ id: 1, rawMaterialId: 10 }], "rawMaterialId"), [{ value: 11, label: "PI — Pineapple" }])
    assert.deepEqual(buildReferenceOptions(references, [], undefined), [])
})

function juiceFormHarness({ watched = {}, clients = [], errors = {} } = {}) {
    const registered = {}
    const overrides = {
        "./juiceCategorySelect.component": { JuiceCategorySelect: "JuiceCategorySelect" },
        ...i18n,
        react: { useId: () => "form" },
        "react-hook-form": {
            Controller: "Controller",
            useForm: () => ({ register: (name, options) => { registered[name] = options; return { name } }, control: {}, handleSubmit: fn => fn, setError() {}, clearErrors() {}, watch: name => watched[name], formState: { errors } }),
        },
        "@tanstack/react-query": { useMutation: () => ({ isPending: false, isError: false, mutate() {} }), useQuery: () => ({ data: { data: clients }, isError: false }), useQueryClient: () => ({ invalidateQueries() {} }) },
        sonner: { toast: { success() {}, error() {} } },
        "@/feature/client/api/client.api": { getClientsAPI() {} },
        "../api/juice.api": { saveJuiceRow() {} },
        ...stubs([["formField", "FormField"], ["input", "Input"], ["select", "Select"], ["searchableSelect", "SearchableSelect"], ["imageUploadField", "ImageUploadField"], ["button", "Button"]]),
    }
    const { JuiceForm } = loader(overrides)("src/feature/juice/component/juiceForm.component.tsx")
    return { registered, render: props => all(JuiceForm({ schema: {}, responseSchema: {}, path: "/x", ...props })) }
}

test("juice form number inputs keep blank/null/value parsing for nullable and required fields", () => {
    const h = juiceFormHarness()
    const nodes = h.render({ fields: [{ name: "tariffRate", kind: "number", step: "0.000001", nullable: true, optional: true }, { name: "costPerUnit", kind: "number", step: "0.0001" }, { name: "code", maxLength: 60 }] })
    assert.equal(h.registered.tariffRate.setValueAs(""), null)
    assert.equal(h.registered.costPerUnit.setValueAs(""), undefined)
    assert.equal(h.registered.tariffRate.setValueAs(null), null)
    assert.equal(h.registered.costPerUnit.setValueAs(null), null)
    assert.equal(h.registered.costPerUnit.setValueAs("0.065"), 0.065)
    assert.equal(h.registered.code, undefined)
    const inputs = Object.fromEntries(nodes.filter(node => node.type === "Input").map(node => [node.props.name, node.props]))
    assert.deepEqual([inputs.tariffRate.type, inputs.tariffRate.min, inputs.tariffRate.placeholder], ["number", 0, "juice.inherit"])
    assert.deepEqual([inputs.costPerUnit.type, inputs.costPerUnit.min, inputs.costPerUnit.placeholder], ["number", 0, undefined])
    assert.deepEqual([inputs.code.type, inputs.code.min, inputs.code.maxLength], ["text", undefined, 60])
    const required = Object.fromEntries(nodes.filter(node => node.type === "FormField").map(node => [node.props.htmlFor, node.props.required]))
    assert.deepEqual(required, { "form-tariffRate": false, "form-costPerUnit": true, "form-code": true })
})

test("juice form recipe preview total and its output element", () => {
    const preview = (percentage, base = 60000000) => mixOutput(juiceFormHarness({ watched: { percentage } }).render({ fields: [{ name: "percentage", kind: "number" }], mixBaseUnits: base }))
    const ready = preview("40")
    assert.ok(ready.props.className.includes("text-success"))
    assert.equal(ready.props.role, undefined)
    assert.ok(text(ready).includes('juice.mixTotal{"total":100}') && text(ready).includes("juice.mixReady"))
    const invalid = preview("abc")
    assert.ok(text(invalid).includes('"total":60') && text(invalid).includes("juice.mixIncomplete") && invalid.props.className.includes("text-danger"))
    assert.ok(text(preview("0.0000004")).includes('"total":60}'))
    assert.ok(text(preview("12.3456789", 0)).includes('"total":12.345679'))
    assert.equal(mixOutput(juiceFormHarness({ watched: { percentage: "40" } }).render({ fields: [{ name: "percentage", kind: "number" }] })), undefined)
})

test("juice form client and reference selects keep their option lists", () => {
    const clients = [{ id: 1, name: "Acme", isActive: true }, { id: 2, name: "Inactive current", isActive: false }, { id: 3, name: "Other active", isActive: true }, { id: 4, name: "Inactive other", isActive: false }]
    const h = juiceFormHarness({ clients })
    const nodes = h.render({ fields: [{ name: "clientId", kind: "client" }, { name: "rawMaterialId", kind: "reference" }], row: { id: 9, clientId: 2 }, references: [{ value: 10, label: "OR — Orange" }] })
    const selectFor = (name, value, onChange = () => {}) => nodes.find(node => node.type === "Controller" && node.props.name === name).props.render({ field: { value, onChange } })
    const client = selectFor("clientId", 2)
    assert.deepEqual(client.props.options.map(option => option.value), [1, 2, 3])
    assert.deepEqual(client.props.value, { value: 2, label: "Inactive current" })
    const changes = []
    selectFor("rawMaterialId", 99, value => changes.push(value)).props.onChange({ value: 10 })
    assert.deepEqual(changes, [10])
    assert.equal(selectFor("rawMaterialId", 99).props.value, null)
})

function juiceSectionHarness({ rows = { data: [] }, references = { data: [] }, permissions = [] } = {}) {
    const state = stateHarness()
    const toggles = []
    const queryFor = key => {
        if (key.length === 3) return { isLoading: false, isError: false, ...rows }
        return { isError: false, ...references }
    }
    const overrides = {
        ...i18n,
        react: { useState: state.useState },
        "@tanstack/react-query": { useQuery: options => queryFor(options.queryKey) },
        "@/shared/auth/usePermission": { usePermission: () => ({ hasPermission: permission => permissions.includes(permission) }) },
        "@/shared/hook/useStatusToggle": { useStatusToggle: () => ({ isPending: false, toggle: (...args) => toggles.push(args) }) },
        "../api/juice.api": { getJuiceRows() {}, setJuiceStatus() {} },
        "./juiceForm.component": { JuiceForm: "JuiceForm" },
        "@/shared/component/table.component": Object.fromEntries(["Table", "TableBody", "TableContainer", "TableEmpty", "TableHead", "TableRow", "Td", "Th"].map(name => [name, name])),
        ...stubs([["card", "Card"], ["modal", "Modal"], ["button", "Button"], ["statusBadge", "StatusBadge"], ["statusToggleButton", "StatusToggleButton"]]),
    }
    const { JuiceSection } = loader(overrides)("src/feature/juice/component/juiceSection.component.tsx")
    function render(props) { state.begin(); return all(JuiceSection(props)) }
    function modal(props) {
        const element = render(props).find(node => typeof node.type === "function" && node.type.name === "JuiceEditorModal")
        return element && all(element.type(element.props))
    }
    return { render, modal, toggles }
}

const mixRows = [{ id: 1, isActive: true, rawMaterialId: 10, percentage: 60 }, { id: 2, isActive: true, rawMaterialId: 11, percentage: 40 }]
const mixReferences = [{ id: 10, code: "OR", displayName: "Orange", isActive: true }, { id: 11, code: "PI", displayName: "Pineapple", isActive: true }, { id: 12, code: "CA", displayName: "Carrot", isActive: true }]

test("juice section shows loading, error and table states", () => {
    const { mixResource } = juiceFieldsModule()
    const loading = juiceSectionHarness({ rows: { isLoading: true } }).render({ resource: mixResource, juiceId: 5 })
    assert.ok(loading.some(node => node.type === "p" && text(node) === "common.loading"))
    assert.ok(!loading.some(node => node.type === "Table"))
    const failed = juiceSectionHarness({ rows: { isError: true, error: { message: "boom" } } }).render({ resource: mixResource, juiceId: 5 })
    assert.ok(failed.some(node => node.props.role === "alert" && text(node) === "boom"))
    assert.ok(!failed.some(node => node.type === "Table"))
    const table = juiceSectionHarness({ rows: { data: mixRows }, references: { data: mixReferences } }).render({ resource: mixResource, juiceId: 5 })
    assert.deepEqual(table.filter(node => node.type === "Td" && typeof node.props.children === "string").map(node => node.props.children), ["Orange", "60", "Pineapple", "40"])
    const empty = juiceSectionHarness().render({ resource: mixResource, juiceId: 5 })
    assert.equal(empty.find(node => node.type === "TableEmpty").props.colSpan, 4)
})

test("juice section recipe total is an output with ready/incomplete state", () => {
    const { mixResource, presentationsResource } = juiceFieldsModule()
    const ready = mixOutput(juiceSectionHarness({ rows: { data: mixRows } }).render({ resource: mixResource, juiceId: 5 }))
    assert.ok(ready.props.className.includes("text-success") && text(ready).includes('"total":100') && text(ready).includes("juice.mixReady"))
    const partial = mixOutput(juiceSectionHarness({ rows: { data: [mixRows[0], { ...mixRows[1], isActive: false }] } }).render({ resource: mixResource, juiceId: 5 }))
    assert.ok(partial.props.className.includes("text-danger") && text(partial).includes('"total":60') && text(partial).includes("juice.mixIncomplete"))
    assert.equal(mixOutput(juiceSectionHarness().render({ resource: presentationsResource, juiceId: 5 })), undefined)
})

test("juice section permissions gate create, edit and status actions", () => {
    const { mixResource } = juiceFieldsModule()
    const actions = nodes => ({ add: nodes.some(node => node.type === "Button"), edit: nodes.some(node => node.type === "button" && text(node) === "common.edit"), toggle: nodes.filter(node => node.type === "StatusToggleButton").length, view: nodes.filter(node => node.type === "button" && text(node) === "juice.viewDetails").length })
    const data = { data: [mixRows[0], { ...mixRows[1], isActive: false }] }
    assert.deepEqual(actions(juiceSectionHarness({ rows: data }).render({ resource: mixResource, juiceId: 5 })), { add: false, edit: false, toggle: 0, view: 2 })
    assert.deepEqual(actions(juiceSectionHarness({ rows: data, permissions: ["juices:create", "juices:edit"] }).render({ resource: mixResource, juiceId: 5 })), { add: true, edit: true, toggle: 2, view: 2 })
    assert.deepEqual(actions(juiceSectionHarness({ rows: data, permissions: ["juices:create", "juices:edit"] }).render({ resource: mixResource, juiceId: 5, readOnly: true })), { add: false, edit: false, toggle: 0, view: 2 })
    assert.deepEqual(actions(juiceSectionHarness({ rows: data, permissions: ["juiceConfig:edit"] }).render({ resource: mixResource, juiceId: 5 })), { add: false, edit: false, toggle: 0, view: 2 })
})

test("juice section status toggle sends the row id and a text label", () => {
    const { presentationsResource, mixResource } = juiceFieldsModule()
    const toggleOf = (resource, data) => {
        const h = juiceSectionHarness({ rows: { data }, permissions: ["juices:edit"] })
        h.render({ resource, juiceId: 5 }).find(node => node.type === "StatusToggleButton").props.onToggle()
        return h.toggles[0]
    }
    assert.deepEqual(toggleOf(presentationsResource, [{ id: 3, isActive: true, displayLabel: "6x354 ML" }]), [3, "6x354 ML", true])
    assert.deepEqual(toggleOf(mixResource, [mixRows[0]]), [1, "juice.recipe", true])
})

test("juice section modal: create, view and edit keep their form configuration", () => {
    const { mixResource } = juiceFieldsModule()
    const h = juiceSectionHarness({ rows: { data: mixRows }, references: { data: mixReferences }, permissions: ["juices:create", "juices:edit"] })
    const props = { resource: mixResource, juiceId: 5 }
    assert.equal(h.modal(props), undefined)
    h.render(props).find(node => node.type === "Button").props.onClick()
    let modal = h.modal(props)
    let form = modal.find(node => node.type === "JuiceForm").props
    assert.equal(modal[0].props.title, "juice.add · juice.recipe")
    assert.deepEqual([form.readOnly, form.path, form.mixBaseUnits, form.schema, form.row], [false, "/admin/juices/mix", 100000000, mixResource.create, undefined])
    assert.deepEqual(form.fixed, { juiceId: 5 })
    assert.deepEqual(form.fields.map(field => field.name), ["rawMaterialId", "percentage"])
    assert.deepEqual(form.references, [{ value: 12, label: "CA — Carrot" }])
    h.render(props).find(node => node.type === "button" && text(node) === "juice.viewDetails").props.onClick()
    modal = h.modal(props)
    form = modal.find(node => node.type === "JuiceForm").props
    assert.equal(modal[0].props.title, "juice.viewDetails · juice.recipe")
    assert.deepEqual([form.readOnly, form.path, form.mixBaseUnits, form.schema], [true, "/admin/juices/mix/1", 40000000, mixResource.update])
    assert.deepEqual(form.fixed, {})
    assert.deepEqual(form.fields.map(field => field.name), ["percentage"])
    assert.ok(modal.some(node => node.type === "p" && node.props.children === "Orange"))
    h.render(props).find(node => node.type === "button" && text(node) === "common.edit").props.onClick()
    modal = h.modal(props)
    assert.equal(modal[0].props.title, "common.edit · juice.recipe")
    assert.equal(modal.find(node => node.type === "JuiceForm").props.readOnly, false)
    modal.find(node => node.type === "JuiceForm").props.onSaved()
    assert.equal(h.modal(props), undefined)
})

function juiceEditorHarness({ juiceId, pathname = "/admin/juices/create", query = { isLoading: false, isError: false } }) {
    const enabled = []
    const overrides = {
        ...i18n,
        "@tanstack/react-query": { useQuery: options => { enabled.push(options.enabled); return query } },
        "react-router-dom": { Link: "Link", useNavigate: () => () => {}, useParams: () => ({ juiceId }), useLocation: () => ({ pathname }) },
        "@/shared/auth/usePermission": { usePermission: () => ({ hasPermission: () => true }) },
        "@/shared/utils/buttonClassName": { buttonClassName: () => "button" },
        "../component/juiceForm.component": { JuiceForm: "JuiceForm" },
        "../component/juiceSection.component": { JuiceSection: "JuiceSection" },
        "../component/juiceProductLink.component": { JuiceProductLink: "JuiceProductLink" },
        "../component/juiceProductConfiguration.component": { JuiceProductConfiguration: "JuiceProductConfiguration" },
        "../api/juice.api": { getJuiceRows() {} },
        ...stubs([["pageContainer", "PageContainer"], ["card", "Card"]]),
    }
    const { JuiceEditorPage } = loader(overrides)("src/feature/juice/page/juiceEditor.page.tsx")
    const nodes = all(JuiceEditorPage())
    return {
        enabled,
        title: text(nodes.find(node => node.type === "h1")),
        alert: nodes.find(node => node.props?.role === "alert"),
        loading: nodes.some(node => node.type === "p" && text(node) === "common.loading"),
        form: nodes.find(node => node.type === "JuiceForm")?.props,
        sections: nodes.filter(node => node.type === "JuiceSection").length,
        configuration: nodes.find(node => node.type === "JuiceProductConfiguration")?.props,
    }
}

test("juice editor page: create, view, edit, invalid id, not found and loading", () => {
    const juice = { id: 5, isActive: true, displayName: "Carrot Pineapple", updatedAt: "x" }
    const create = juiceEditorHarness({ juiceId: undefined })
    assert.deepEqual([create.title, create.alert, create.loading, create.form.readOnly, create.form.path, create.sections], ["juice.create", undefined, false, false, "/admin/juices/with-product", 0])
    assert.equal(create.form.fields[0].name, "subCategoryId")
    const view = juiceEditorHarness({ juiceId: "5", pathname: "/admin/juices/5", query: { isLoading: false, isError: false, data: [juice] } })
    assert.deepEqual([view.title, view.form.readOnly, view.form.path, view.sections], ["juice.view · Carrot Pineapple", true, "/admin/juices/5", 2])
    const edit = juiceEditorHarness({ juiceId: "5", pathname: "/admin/juices/5/edit", query: { isLoading: false, isError: false, data: [juice] } })
    assert.deepEqual([edit.title, edit.form.readOnly, edit.sections], ["juice.edit · Carrot Pineapple", false, 2])
    const linked = juiceEditorHarness({ juiceId: "5", pathname: "/admin/juices/5/edit", query: { isLoading: false, isError: false, data: [{ ...juice, productId: 8 }] } })
    assert.equal(linked.form, undefined)
    assert.equal(linked.configuration.productId, 8)
    assert.equal(linked.configuration.readOnly, false)
    const inactive = juiceEditorHarness({ juiceId: "5", pathname: "/admin/juices/5/edit", query: { isLoading: false, isError: false, data: [{ ...juice, isActive: false }] } })
    assert.deepEqual([inactive.title, inactive.form.readOnly], ["juice.view · Carrot Pineapple", true])
    for (const juiceId of ["abc", "0", "2147483648", "1.5"]) {
        const invalid = juiceEditorHarness({ juiceId, pathname: `/admin/juices/${juiceId}` })
        assert.deepEqual([text(invalid.alert), invalid.form, invalid.enabled[0]], ["juice.notFound", undefined, false])
    }
    const missing = juiceEditorHarness({ juiceId: "6", pathname: "/admin/juices/6", query: { isLoading: false, isError: false, data: [juice] } })
    assert.deepEqual([missing.title, text(missing.alert), missing.form], ["juice.view", "juice.notFound", undefined])
    const failed = juiceEditorHarness({ juiceId: "5", pathname: "/admin/juices/5", query: { isLoading: false, isError: true, error: { message: "boom" } } })
    assert.equal(text(failed.alert), "boom")
    const loading = juiceEditorHarness({ juiceId: "5", pathname: "/admin/juices/5", query: { isLoading: true, isError: false } })
    assert.deepEqual([loading.loading, loading.alert, loading.form], [true, undefined, undefined])
})

class FakeBulkImportApiError extends Error {
    constructor(message, rowErrors) { super(message); this.rowErrors = rowErrors }
}

function importPanelHarness({ preview = null, file = null, validateError = null, confirmPending = false } = {}) {
    const state = stateHarness()
    state.slots.push(file, preview, null)
    const confirmed = []
    const mutations = () => [
        { isPending: false, mutate() {} },
        { isPending: false, error: validateError, mutate() {}, reset() {} },
        { isPending: confirmPending, error: null, mutate: value => confirmed.push(value), reset() {} },
    ]
    let created = []
    const overrides = {
        "react-i18next": { useTranslation: () => ({ t, i18n: { language: "es" } }) },
        react: { useState: state.useState, useRef: value => ({ current: value }) },
        "@tanstack/react-query": { useMutation: () => created.shift(), useQueryClient: () => ({ invalidateQueries() {} }) },
        "lucide-react": Object.fromEntries(["Download", "AlertTriangle", "CheckCircle2", "FileSpreadsheet", "ShieldCheck"].map(name => [name, name])),
        sonner: { toast: { success() {}, error() {} } },
        "@/shared/component/importFilePicker.component": { ImportFilePicker: "ImportFilePicker" },
        "@/shared/component/importInstructions.component": { ImportInstructions: "ImportInstructions" },
        "@/shared/component/table.component": Object.fromEntries(["Table", "TableBody", "TableContainer", "TableHead", "TableRow", "Td", "Th"].map(name => [name, name])),
        "@/shared/component/button.component": { Button: "Button" },
        "@/shared/api/bulkImport.api": { BulkImportApiError: FakeBulkImportApiError },
        "@/shared/utils/importFile": { isValidImportFile: () => true },
        "@/shared/utils/downloadBlob": { downloadBlob() {} },
        "../api/product.api": { downloadProductImportTemplateAPI() {} },
        "../api/initialProductImport.api": { previewInitialProductImportAPI() {}, confirmInitialProductImportAPI() {} },
    }
    const { InitialProductImportPanel } = loader(overrides)("src/feature/product/component/initialProductImportPanel.component.tsx")
    function render(props = {}) { state.begin(); created = mutations(); return all(InitialProductImportPanel(props)) }
    const confirmButton = nodes => nodes.find(node => node.type === "Button" && /initialProductImport\.(confirm|importing)/.test(text(node)))
    return { render, confirmButton, confirmed }
}

const issue = (row, message, sheet = "Productos y SKUs", field = "skuCode") => ({ sheet, row, field, message })
const material = (row, overrides = {}) => ({ row, skuCode: "SKU", packagingCode: "MP", materialName: "Box", materialType: "CAJA", level: "pallet", group: null, isDefault: false, quantityBasis: "per_pallet", consumptionRule: "1 por palet", quantityPerPallet: null, ruleSource: null, quantity: 1, unitCost: 1, action: "new", previous: null, issues: [], warnings: [], ...overrides })
const preview = (overrides = {}) => ({ previewHash: "hash-1", summary: { products: 1, variants: 1, unit: 0, intermediate: 0, pallet: 2, errors: 0, warnings: 0 }, products: [], materials: [], issues: [], ...overrides })
const keysOf = nodes => nodes.map(node => node.key)

test("initial product import row errors keep order with stable, unique keys", () => {
    const rowErrors = [issue(3, "SKU repetido"), issue(3, "SKU repetido"), { row: 4, field: "clientId", message: "Falta cliente" }]
    const h = importPanelHarness({ validateError: new FakeBulkImportApiError("Archivo inválido", rowErrors) })
    const alert = () => h.render().find(node => node.props?.role === "alert")
    assert.equal(text(all(alert()).find(node => node.type === "p")), "Archivo inválido")
    const rows = all(alert()).filter(node => node.type === "li")
    assert.deepEqual(rows.map(text), ['Productos y SKUs · initialProductImport.rowError{"row":3,"message":"SKU repetido"}', 'Productos y SKUs · initialProductImport.rowError{"row":3,"message":"SKU repetido"}', 'initialProductImport.rowError{"row":4,"message":"Falta cliente"}'])
    assert.equal(new Set(keysOf(rows)).size, 3)
    assert.deepEqual(keysOf(all(alert()).filter(node => node.type === "li")), keysOf(rows))
    assert.ok(keysOf(rows).every(key => !/^\d+$/.test(key)))
})

test("initial product import preview: summary output, default column, issues and warnings", () => {
    const materials = [
        material(2),
        material(3, { group: "Caja", isDefault: true, issues: [{ row: 3, field: "quantity", message: "Cantidad inválida" }, { row: 3, field: "quantity", message: "Cantidad inválida" }], warnings: [{ row: 3, field: "rule", message: "Regla heredada" }] }),
        material(4, { group: "Caja", isDefault: false }),
    ]
    const h = importPanelHarness({ file: { name: "p.xlsx" }, preview: preview({ materials, issues: [issue(5, "Grupo sin predeterminado", "Empaques"), issue(5, "Grupo sin predeterminado", "Empaques")] }) })
    const nodes = h.render()
    const summary = nodes.find(node => node.type === "output")
    assert.ok(summary.props.className.includes("grid") && summary.props.role === undefined)
    const stats = all(summary).filter(node => node.type === "div")
    const expectedSummary = preview().summary
    assert.deepEqual(stats.map(node => node.key), Object.keys(expectedSummary))
    for (const tile of stats) {
        const values = all(tile).filter(node => node.type === "p")
        assert.equal(values[0].props.children, expectedSummary[tile.key])
        assert.equal(text(values[1]), `initialProductImport.stats.${tile.key}`)
    }
    assert.equal(h.render({ bare: true })[0].props.className, "")
    assert.ok(nodes[0].props.className.includes("rounded-panel"))
    const materialRows = nodes.filter(node => node.type === "TableRow" && node.key !== null)
    assert.deepEqual(materialRows.map(row => all(row).filter(node => node.type === "Td")[6].props.children), ["—", "common.yes", "common.no"])
    const stateCell = all(materialRows[1]).filter(node => node.type === "Td")[8]
    const messages = all(stateCell).filter(node => node.type === "p")
    assert.deepEqual(messages.map(text), ["Cantidad inválida", "Cantidad inválida", "Regla heredada"])
    assert.ok(messages.slice(0, 2).every(node => node.props.className.split(" ").includes("text-danger")))
    assert.ok(messages[2].props.className.split(" ").includes("text-warning-fg"))
    assert.equal(new Set(keysOf(messages.slice(0, 2))).size, 2)
    const fileIssues = all(nodes.find(node => node.props?.role === "alert")).filter(node => node.type === "li")
    assert.equal(fileIssues.length, 2)
    assert.equal(new Set(keysOf(fileIssues)).size, 2)
    assert.equal(text(fileIssues[0]), 'Empaques · initialProductImport.rowError{"row":5,"message":"Grupo sin predeterminado"}')
})

test("initial product import confirm is enabled only for a clean preview with variants", () => {
    const enabled = importPanelHarness({ file: { name: "p.xlsx" }, preview: preview() })
    const button = enabled.confirmButton(enabled.render())
    assert.equal(button.props.disabled, false)
    button.props.onClick()
    assert.deepEqual(enabled.confirmed, [{ file: { name: "p.xlsx" }, hash: "hash-1" }])
    for (const options of [
        { file: { name: "p.xlsx" }, preview: preview({ summary: { ...preview().summary, errors: 1 } }) },
        { file: { name: "p.xlsx" }, preview: preview({ summary: { ...preview().summary, variants: 0 } }) },
        { file: null, preview: preview() },
        { file: { name: "p.xlsx" }, preview: preview(), confirmPending: true },
    ]) {
        const h = importPanelHarness(options)
        assert.equal(h.confirmButton(h.render()).props.disabled, true)
    }
    const none = importPanelHarness({ file: { name: "p.xlsx" } })
    const nodes = none.render()
    assert.equal(none.confirmButton(nodes), undefined)
    assert.equal(nodes.find(node => node.type === "output"), undefined)
})

test("active juice catalog has no selling price, margin or logistics configuration", () => {
    const { juiceFields, presentationsResource } = juiceFieldsModule()
    assert.ok(!juiceFields.some(field => field.name === "pricePerPound"))
    assert.ok(!presentationsResource.fields.some(field => field.name === "marginPerCase"))
    const schemas = loader()("src/feature/juice/schema/juice.schema.ts")
    assert.equal(schemas.juiceInputSchema.safeParse({ code: "SYN", displayName: "Synthetic", clientId: 1 }).success, true)
    assert.equal(schemas.juiceInputSchema.safeParse({ code: "SYN", displayName: "Synthetic", clientId: 1, pricePerPound: 2 }).success, false)
    const routes = fs.readFileSync("src/shared/router/AdminRoutes.tsx", "utf8")
    assert.ok(!routes.includes('path: "juice-config"'))
})
