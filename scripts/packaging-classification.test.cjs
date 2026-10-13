const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")
const React = require("react")
const resources = { es: require("../src/shared/i18n/locales/es/translation.json"), en: require("../src/shared/i18n/locales/en/translation.json") }
const nodes = tree => !tree || typeof tree !== "object" ? [] : [tree, ...[].concat(tree.props?.children ?? []).flat(Infinity).flatMap(nodes)]
function harness(lang = "es", extra = {}) {
    const slots = []; let cursor = 0
    const t = key => {
        const value = key.split(".").reduce((node, part) => node?.[part], resources[lang])
        assert.equal(typeof value, "string", `Missing translation ${lang}:${key}`)
        return value
    }
    const overrides = {
        react: { ...React, useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = value }] } },
        "react-i18next": { useTranslation: () => ({ t, i18n: { language: lang } }) },
        "@/shared/component/select.component": { Select: "select" },
        "@/shared/component/formField.component": { FormField: "FormField" },
        "@/shared/component/paginatedAdminTable.component": { PaginatedAdminTable: "Table" },
        "@/shared/component/editLink.component": { EditLink: "EditLink" },
        "@/shared/i18n/getFieldErrorMessage": { getFieldErrorMessage: () => undefined },
        "./packagingBaseFields.component": { PackagingBaseFields: "BaseFields" },
        "./packagingConsumptionFields.component": { PackagingConsumptionFields: "ConsumptionFields" },
        "@/shared/format/currency": { formatCurrency: value => String(value) },
        "@/shared/format/date": { formatDateTime: value => String(value) },
        ...extra,
    }
    const cache = new Map()
    function load(file) {
        file = path.resolve(file)
        if (cache.has(file)) return cache.get(file).exports
        const module = { exports: {} }; cache.set(file, module)
        const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText
        const localRequire = name => {
            if (name in overrides) return overrides[name]
            if (name.startsWith("@/") || name.startsWith(".")) {
                const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(file), name)
                return load([`${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate)))
            }
            return require(name)
        }
        vm.runInNewContext(`(function(require,module,exports){${source}\n})`, { console })(localRequire, module, module.exports)
        return module.exports
    }
    return { load, setLanguage: value => { lang = value }, render: fn => { cursor = 0; return fn() } }
}
for (const language of ["es", "en"]) {
    test(`classification, level and state filters reach the server; page resets (${language})`, async () => {
        let sent
        const h = harness(language, { "@/feature/packaging/api/packaging.api": { getPackagingsPaginatedAPI: async params => { sent = params } } })
        const { PackagingTable } = h.load("src/feature/packaging/component/packagingTable.component.tsx")
        let tree = h.render(PackagingTable)
        const selects = nodes(tree).filter(node => node.type === "select")
        assert.equal(selects.length, 3)
        selects[0].props.onChange({ target: { value: "generic" } })
        selects[1].props.onChange({ target: { value: "pallet" } })
        selects[2].props.onChange({ target: { value: "inactive" } })
        tree = h.render(PackagingTable)
        const table = nodes(tree).find(node => node.type === "Table")
        assert.equal(table.key, "generic-pallet-inactive")
        await table.props.queryFn({ page: 1, search: "LEG" })
        assert.deepEqual(JSON.parse(JSON.stringify(sent)), { page: 1, search: "LEG", classification: "generic", packagingRole: "pallet", status: "inactive" })
        for (const column of table.props.columns) column.render({ id: 1, code: "LEG", classification: "generic", packagingRole: "pallet", isActive: false, unitCost: 0.1234, updatedAt: "2026-10-12" })
    })
    test(`form offers both classifications and existing state field (${language})`, () => {
        const h = harness(language)
        const { PackagingForm } = h.load("src/feature/packaging/component/packagingForm.component.tsx")
        const tree = PackagingForm({ register: name => ({ name }), errors: {}, packagingRole: "pallet", editing: true })
        const base = nodes(tree).find(node => node.type === "BaseFields")
        const classification = nodes(base.props.roleField).find(node => node.type === "select" && node.props.id === "classification")
        assert.deepEqual(nodes(classification).filter(node => node.type === "option").map(node => node.props.value), ["specific", "generic"])
        assert.ok(nodes(tree).some(node => node.type === "input" && node.props.name === "isActive"))
        assert.ok(nodes(tree).some(node => node.type === "ConsumptionFields"))
    })
}
test("schemas preserve four-decimal costs and require classification for both material types", () => {
    const h = harness()
    const { createPackagingSchema, responsePackagingSchema } = h.load("src/feature/packaging/schema/packaging.schema.ts")
    const base = { displayNameEn: "Generic", code: "GEN-1", displayName: "Generic", packagingRole: "unit", unitCost: 0.1234 }
    for (const classification of ["specific", "generic"]) {
        assert.equal(createPackagingSchema.parse({ ...base, classification }).unitCost, 0.1234)
        assert.equal(responsePackagingSchema.parse({ ...base, classification, id: 1, isActive: true, createdAt: "2026-10-12", updatedAt: "2026-10-12" }).classification, classification)
    }
    assert.equal(createPackagingSchema.safeParse(base).success, false)
    assert.equal(createPackagingSchema.safeParse({ ...base, classification: "generic", unitCost: 0.12345 }).success, false)
})


test("catalog names change with the current language and fall back for historical records", () => {
    const h = harness("es", { "@/feature/packaging/api/packaging.api": { getPackagingsPaginatedAPI: async () => {} } })
    const { packagingName } = h.load("src/shared/i18n/packagingName.ts")
    assert.equal(packagingName({ displayName: "Bolsa", displayNameEn: "Bag" }, "en-US"), "Bag")
    for (const displayNameEn of [null, undefined, "", "   "]) assert.equal(packagingName({ displayName: "Original name", displayNameEn }, "en"), "Original name")
    const { PackagingTable } = h.load("src/feature/packaging/component/packagingTable.component.tsx")
    const material = { displayName: "Bolsa", displayNameEn: "Bag" }
    let table = nodes(h.render(PackagingTable)).find(node => node.type === "Table")
    assert.equal(table.props.columns.find(column => column.key === "displayName").render(material), "Bolsa")
    h.setLanguage("en")
    table = nodes(h.render(PackagingTable)).find(node => node.type === "Table")
    assert.equal(table.props.columns.find(column => column.key === "displayName").render(material), "Bag")
})
test("new forms require English while historical edit forms can retain a missing translation", () => {
    const h = harness("es", { "@/shared/component/registeredField.component": { RegisteredField: "Field" }, "@/shared/form/toOptionalNumber": { toOptionalNumber: value => value } })
    const { PackagingBaseFields } = h.load("src/feature/packaging/component/packagingBaseFields.component.tsx")
    for (const requireEnglish of [true, false]) {
        const tree = PackagingBaseFields({ register: name => ({ name }), errors: {}, requireEnglish })
        const fields = nodes(tree).filter(node => node.type === "Field")
        assert.equal(fields.find(node => node.props.name === "displayNameEn").props.inputProps.required, requireEnglish)
        const grid = nodes(tree).find(node => node.props?.className?.includes("md:grid-cols-2"))
        assert.equal(nodes(grid).filter(node => node.type === "Field").length, 2)
    }
})
test("packaging PDFs and draft summaries use the selected stored language without mutating snapshots", () => {
    const h = harness()
    const { buildPdfPackagingMaterials } = h.load("src/feature/quote/component/quotePdfPackaging.ts")
    const { buildPackagingConfiguration } = h.load("src/feature/quote/component/quotePackagingConfig.ts")
    const snapshot = { unitMaterials: [{ displayName: "Bolsa", displayNameEn: "Bag", optionGroup: null }], palletMaterials: [{ displayName: "Caja", displayNameEn: "Box", optionGroup: "Carton", materialType: "CAJA" }] }
    const before = JSON.stringify(snapshot)
    assert.equal(buildPdfPackagingMaterials(snapshot, "es")[0].name, "Bolsa")
    assert.equal(buildPdfPackagingMaterials(snapshot, "en")[0].name, "Bag")
    assert.equal(buildPackagingConfiguration(snapshot, "en")[1].groups[0].material, "Box")
    assert.equal(buildPackagingConfiguration(snapshot, "es")[1].groups[0].material, "Caja")
    assert.equal(JSON.stringify(snapshot), before)
})
