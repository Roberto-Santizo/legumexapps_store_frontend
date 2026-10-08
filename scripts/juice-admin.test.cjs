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

test("juice cell values never render object stringification", () => {
    const { formatJuiceCellValue, juiceRowLabel } = loader()("src/feature/juice/component/juiceSectionRows.ts")
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
    const { juiceEditorTitleKey, juiceRowPath, recipeMixBaseUnits, buildReferenceOptions } = loader()("src/feature/juice/component/juiceSectionRows.ts")
    const { mixResource, overridesResource, presentationsResource } = juiceFieldsModule()
    const row = { id: 4, clientId: 9, isActive: true, percentage: 42.123456 }
    assert.equal(juiceEditorTitleKey(true, row), "juice.viewDetails")
    assert.equal(juiceEditorTitleKey(true, undefined), "juice.viewDetails")
    assert.equal(juiceEditorTitleKey(false, row), "common.edit")
    assert.equal(juiceEditorTitleKey(false, undefined), "juice.add")
    assert.equal(juiceRowPath(mixResource, undefined, false), "/admin/juices/mix")
    assert.equal(juiceRowPath(mixResource, row, false), "/admin/juices/mix/4")
    assert.equal(juiceRowPath(overridesResource, row, true), "/admin/juice-config/client-overrides/9")
    assert.equal(recipeMixBaseUnits(presentationsResource, 100000000, row), undefined)
    assert.equal(recipeMixBaseUnits(mixResource, 100000000, row), 100000000 - 42123456)
    assert.equal(recipeMixBaseUnits(mixResource, 100000000, { ...row, isActive: false }), 100000000)
    assert.equal(recipeMixBaseUnits(mixResource, 60000000, undefined), 60000000)
    const references = [{ id: 10, code: "OR", displayName: "Orange", isActive: true }, { id: 11, code: "PI", displayName: "Pineapple", isActive: true }, { id: 12, code: "CA", displayName: "Carrot", isActive: false }]
    assert.deepEqual(buildReferenceOptions(references, [{ id: 1, rawMaterialId: 10 }], "rawMaterialId"), [{ value: 11, label: "PI — Pineapple" }])
    assert.deepEqual(buildReferenceOptions(references, [], undefined), [])
})

test("constant field steps: pallets whole, rates six decimals, money four decimals", () => {
    const steps = Object.fromEntries(juiceFieldsModule().constantFields.map(field => [field.name, field.step]))
    assert.equal(steps.palletsPerContainer, "1")
    for (const name of ["unexpectedRate", "tariffRate", "portFeeRate", "salesmanCommissionRate", "distributorCommissionRate"]) assert.equal(steps[name], "0.000001")
    for (const name of ["directLaborPerPound", "freightPerContainer", "storagePerContainer"]) assert.equal(steps[name], "0.0001")
    assert.equal(Object.keys(steps).length, 22)
})

function juiceFormHarness({ watched = {}, clients = [], errors = {} } = {}) {
    const registered = {}
    const overrides = {
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
    const nodes = h.render({ fields: [{ name: "tariffRate", kind: "number", step: "0.000001", nullable: true, optional: true }, { name: "pricePerPound", kind: "number", step: "0.0001" }, { name: "code", maxLength: 60 }] })
    assert.equal(h.registered.tariffRate.setValueAs(""), null)
    assert.equal(h.registered.pricePerPound.setValueAs(""), undefined)
    assert.equal(h.registered.tariffRate.setValueAs(null), null)
    assert.equal(h.registered.pricePerPound.setValueAs(null), null)
    assert.equal(h.registered.pricePerPound.setValueAs("0.065"), 0.065)
    assert.equal(h.registered.code, undefined)
    const inputs = Object.fromEntries(nodes.filter(node => node.type === "Input").map(node => [node.props.name, node.props]))
    assert.deepEqual([inputs.tariffRate.type, inputs.tariffRate.min, inputs.tariffRate.placeholder], ["number", 0, "juice.inherit"])
    assert.deepEqual([inputs.pricePerPound.type, inputs.pricePerPound.min, inputs.pricePerPound.placeholder], ["number", 0, undefined])
    assert.deepEqual([inputs.code.type, inputs.code.min, inputs.code.maxLength], ["text", undefined, 60])
    const required = Object.fromEntries(nodes.filter(node => node.type === "FormField").map(node => [node.props.htmlFor, node.props.required]))
    assert.deepEqual(required, { "form-tariffRate": false, "form-pricePerPound": true, "form-code": true })
})

test("juice form fraction help is linked only on the sectioned rate inputs", () => {
    const h = juiceFormHarness()
    const rate = { name: "tariffRate", kind: "number", step: "0.000001" }
    const money = { name: "hppPerPound", kind: "number", step: "0.0001" }
    const nodes = h.render({ fields: [rate, money], fieldSections: [{ titleKey: "rates", fields: [rate], fractionHelp: true }, { titleKey: "money", fields: [money] }] })
    const inputs = Object.fromEntries(nodes.filter(node => node.type === "Input").map(node => [node.props.name, node.props]))
    assert.equal(inputs.tariffRate["aria-describedby"], "form-tariffRate-fraction-help")
    assert.equal(inputs.hppPerPound["aria-describedby"], undefined)
    assert.ok(nodes.some(node => node.type === "p" && node.props.id === "form-tariffRate-fraction-help"))
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
    const clients = [{ id: 1, name: "Acme", isActive: true }, { id: 2, name: "Inactive current", isActive: false }, { id: 3, name: "Has override", isActive: true }, { id: 4, name: "Inactive other", isActive: false }]
    const h = juiceFormHarness({ clients })
    const nodes = h.render({ fields: [{ name: "clientId", kind: "client" }, { name: "rawMaterialId", kind: "reference" }], row: { id: 9, clientId: 2 }, excludedClients: [3], references: [{ value: 10, label: "OR — Orange" }] })
    const selectFor = (name, value, onChange = () => {}) => nodes.find(node => node.type === "Controller" && node.props.name === name).props.render({ field: { value, onChange } })
    const client = selectFor("clientId", 2)
    assert.deepEqual(client.props.options.map(option => option.value), [1, 2])
    assert.deepEqual(client.props.value, { value: 2, label: "Inactive current" })
    const changes = []
    selectFor("rawMaterialId", 99, value => changes.push(value)).props.onChange({ value: 10 })
    assert.deepEqual(changes, [10])
    assert.equal(selectFor("rawMaterialId", 99).props.value, null)
})

function juiceSectionHarness({ rows = { data: [] }, references = { data: [] }, clients = { data: { data: [] } }, permissions = [] } = {}) {
    const state = stateHarness()
    const toggles = []
    const queryFor = key => {
        if (key[0] === "clients") return { isError: false, ...clients }
        if (key.length === 3) return { isLoading: false, isError: false, ...rows }
        return { isError: false, ...references }
    }
    const overrides = {
        ...i18n,
        react: { useState: state.useState },
        "@tanstack/react-query": { useQuery: options => queryFor(options.queryKey) },
        "@/shared/auth/usePermission": { usePermission: () => ({ hasPermission: permission => permissions.includes(permission) }) },
        "@/shared/hook/useStatusToggle": { useStatusToggle: () => ({ isPending: false, toggle: (...args) => toggles.push(args) }) },
        "@/feature/client/api/client.api": { getClientsAPI() {} },
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
    const { mixResource, overridesResource } = juiceFieldsModule()
    const actions = nodes => ({ add: nodes.some(node => node.type === "Button"), edit: nodes.some(node => node.type === "button" && text(node) === "common.edit"), toggle: nodes.filter(node => node.type === "StatusToggleButton").length, view: nodes.filter(node => node.type === "button" && text(node) === "juice.viewDetails").length })
    const data = { data: [mixRows[0], { ...mixRows[1], isActive: false }] }
    assert.deepEqual(actions(juiceSectionHarness({ rows: data }).render({ resource: mixResource, juiceId: 5 })), { add: false, edit: false, toggle: 0, view: 2 })
    assert.deepEqual(actions(juiceSectionHarness({ rows: data, permissions: ["juices:create", "juices:edit"] }).render({ resource: mixResource, juiceId: 5 })), { add: true, edit: true, toggle: 2, view: 2 })
    assert.deepEqual(actions(juiceSectionHarness({ rows: data, permissions: ["juices:create", "juices:edit"] }).render({ resource: mixResource, juiceId: 5, readOnly: true })), { add: false, edit: false, toggle: 0, view: 2 })
    const override = { data: [{ id: 7, clientId: 3, isActive: true }] }
    assert.deepEqual(actions(juiceSectionHarness({ rows: override, permissions: ["juices:create", "juices:edit"] }).render({ resource: overridesResource })), { add: false, edit: false, toggle: 0, view: 1 })
    assert.deepEqual(actions(juiceSectionHarness({ rows: override, permissions: ["juiceConfig:edit"] }).render({ resource: overridesResource })), { add: true, edit: true, toggle: 1, view: 1 })
})

test("juice section status toggle sends the row id (or client id) and a text label", () => {
    const { presentationsResource, overridesResource, mixResource } = juiceFieldsModule()
    const toggleOf = (resource, data) => {
        const h = juiceSectionHarness({ rows: { data }, permissions: ["juices:edit", "juiceConfig:edit"] })
        h.render({ resource, juiceId: 5 }).find(node => node.type === "StatusToggleButton").props.onToggle()
        return h.toggles[0]
    }
    assert.deepEqual(toggleOf(presentationsResource, [{ id: 3, isActive: true, displayLabel: "6x354 ML" }]), [3, "6x354 ML", true])
    assert.deepEqual(toggleOf(mixResource, [mixRows[0]]), [1, "juice.recipe", true])
    assert.deepEqual(toggleOf(overridesResource, [{ id: 7, clientId: 3, isActive: false }]), [3, "juice.overrides", false])
})

test("juice section modal: create, view and edit keep their form configuration", () => {
    const { mixResource, overridesResource } = juiceFieldsModule()
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

    const overrides = juiceSectionHarness({ rows: { data: [{ id: 7, clientId: 3, isActive: true }, { id: 8, clientId: 4, isActive: false }] }, clients: { data: { data: [{ id: 3, name: "Acme" }] } }, permissions: ["juiceConfig:edit"] })
    overrides.render({ resource: overridesResource }).find(node => node.type === "button" && text(node) === "common.edit").props.onClick()
    const overrideModal = overrides.modal({ resource: overridesResource })
    const overrideForm = overrideModal.find(node => node.type === "JuiceForm").props
    assert.deepEqual([overrideForm.path, overrideForm.mixBaseUnits], ["/admin/juice-config/client-overrides/3", undefined])
    assert.deepEqual(overrideForm.excludedClients, [3, 4])
    assert.ok(!overrideForm.fields.some(field => field.name === "clientId"))
    assert.ok(overrideModal.some(node => node.type === "p" && node.props.children === "Acme"))
})

function juiceEditorHarness({ juiceId, pathname = "/admin/juices/create", query = { isLoading: false, isError: false } }) {
    const enabled = []
    const overrides = {
        ...i18n,
        "@tanstack/react-query": { useQuery: options => { enabled.push(options.enabled); return query } },
        "react-router-dom": { Link: "Link", useNavigate: () => () => {}, useParams: () => ({ juiceId }), useLocation: () => ({ pathname }) },
        "@/shared/auth/usePermission": { usePermission: () => ({ hasPermission: () => true }) },
        "@/shared/component/buttonClassName": { buttonClassName: () => "button" },
        "../component/juiceForm.component": { JuiceForm: "JuiceForm" },
        "../component/juiceSection.component": { JuiceSection: "JuiceSection" },
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
    }
}

test("juice editor page: create, view, edit, invalid id, not found and loading", () => {
    const juice = { id: 5, isActive: true, displayName: "Carrot Pineapple", updatedAt: "x" }
    const create = juiceEditorHarness({ juiceId: undefined })
    assert.deepEqual([create.title, create.alert, create.loading, create.form.readOnly, create.form.path, create.sections], ["juice.create", undefined, false, false, "/admin/juices", 0])
    const view = juiceEditorHarness({ juiceId: "5", pathname: "/admin/juices/5", query: { isLoading: false, isError: false, data: [juice] } })
    assert.deepEqual([view.title, view.form.readOnly, view.form.path, view.sections], ["juice.view · Carrot Pineapple", true, "/admin/juices/5", 3])
    const edit = juiceEditorHarness({ juiceId: "5", pathname: "/admin/juices/5/edit", query: { isLoading: false, isError: false, data: [juice] } })
    assert.deepEqual([edit.title, edit.form.readOnly, edit.sections], ["juice.edit · Carrot Pineapple", false, 3])
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
        ...i18n,
        react: { useState: state.useState, useRef: value => ({ current: value }) },
        "@tanstack/react-query": { useMutation: () => created.shift(), useQueryClient: () => ({ invalidateQueries() {} }) },
        "lucide-react": { Download: "Download", Upload: "Upload" },
        sonner: { toast: { success() {}, error() {} } },
        "@/shared/component/importFilePicker.component": { ImportFilePicker: "ImportFilePicker" },
        "@/shared/component/table.component": Object.fromEntries(["Table", "TableBody", "TableContainer", "TableHead", "TableRow", "Td", "Th"].map(name => [name, name])),
        "@/shared/component/button.component": { Button: "Button" },
        "@/shared/api/bulkImport.api": { BulkImportApiError: FakeBulkImportApiError },
        "@/shared/utils/importFile": { isValidImportFile: () => true },
        "@/shared/utils/downloadBlob": { downloadBlob() {} },
        "../api/product.api": { downloadProductImportTemplateAPI() {} },
        "../api/initialProductImport.api": { previewInitialProductImportAPI() {}, confirmInitialProductImportAPI() {} },
    }
    const { InitialProductImportPanel } = loader(overrides)("src/feature/product/component/initialProductImportPanel.component.tsx")
    function render() { state.begin(); created = mutations(); return all(InitialProductImportPanel()) }
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
    const paragraphs = () => h.render().find(node => node.props?.role === "alert").props.children.flat().filter(node => node?.type === "p")
    const first = paragraphs()
    assert.equal(text(first[0]), "Archivo inválido")
    const rows = first.slice(1)
    assert.deepEqual(rows.map(text), ['Productos y SKUs · initialProductImport.rowError{"row":3,"message":"SKU repetido"}', 'Productos y SKUs · initialProductImport.rowError{"row":3,"message":"SKU repetido"}', 'initialProductImport.rowError{"row":4,"message":"Falta cliente"}'])
    assert.equal(new Set(keysOf(rows)).size, 3)
    assert.deepEqual(keysOf(paragraphs().slice(1)), keysOf(rows))
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
    assert.ok(summary.props.className.includes("block") && summary.props.role === undefined)
    assert.ok(text(summary).startsWith("initialProductImport.summary"))
    const materialRows = nodes.filter(node => node.type === "TableRow" && node.key !== null)
    assert.deepEqual(materialRows.map(row => all(row).filter(node => node.type === "Td")[6].props.children), ["—", "common.yes", "common.no"])
    const stateCell = all(materialRows[1]).filter(node => node.type === "Td")[8]
    const messages = all(stateCell).filter(node => node.type === "p")
    assert.deepEqual(messages.map(text), ["Cantidad inválida", "Cantidad inválida", "Regla heredada"])
    assert.deepEqual(messages.map(node => node.props.className), ["text-sm text-danger", "text-sm text-danger", "text-sm text-ink-600"])
    assert.equal(new Set(keysOf(messages.slice(0, 2))).size, 2)
    const fileIssues = all(nodes.find(node => node.props?.role === "alert")).filter(node => node.type === "p")
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
