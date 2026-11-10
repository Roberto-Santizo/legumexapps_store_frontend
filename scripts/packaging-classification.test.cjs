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
        const classification = nodes(base.props.leadingField).find(node => node.type === "select" && node.props.id === "classification")
        assert.deepEqual(nodes(classification).filter(node => node.type === "option").map(node => node.props.value), ["specific", "generic"])
        assert.ok(nodes(tree).some(node => node.type === "input" && node.props.name === "isActive"))
        assert.ok(nodes(tree).some(node => node.type === "ConsumptionFields"))
        assert.equal(base.props.systemCode, undefined, "specific materials ask for their code")
    })
    test(`generic materials show the system code instead of a code input (${language})`, () => {
        const h = harness(language)
        const { PackagingForm } = h.load("src/feature/packaging/component/packagingForm.component.tsx")
        const base = nodes(PackagingForm({ register: name => ({ name }), errors: {}, packagingRole: "unit", classification: "generic", currentCode: "GEN-IND-0007" })).find(node => node.type === "BaseFields")
        assert.ok(JSON.stringify(base.props.systemCode).includes("GEN-IND-0007"))
        const created = nodes(PackagingForm({ register: name => ({ name }), errors: {}, packagingRole: "unit", classification: "generic" })).find(node => node.type === "BaseFields")
        assert.ok(created.props.systemCode)
    })
}
test("schemas preserve twelve-decimal costs and require classification for both material types", () => {
    const h = harness()
    const { createPackagingSchema, updatePackagingSchema, responsePackagingSchema } = h.load("src/feature/packaging/schema/packaging.schema.ts")
    const base = { displayNameEn: "Generic", code: "GEN-1", displayName: "Generic", packagingRole: "unit", unitCost: 0.1234 }
    for (const classification of ["specific", "generic"]) {
        assert.equal(createPackagingSchema.parse({ ...base, classification }).unitCost, 0.1234)
        assert.equal(responsePackagingSchema.parse({ ...base, classification, materialType: "INDIVIDUAL", id: 1, isActive: true, createdAt: "2026-10-12", updatedAt: "2026-10-12" }).classification, classification)
    }
    assert.equal(createPackagingSchema.safeParse(base).success, false)
    for (const unitCost of [0, 0.12345, 0.123456789012, 0.000000000001, 999999.9999]) {
        for (const classification of ["specific", "generic"]) {
            assert.equal(createPackagingSchema.parse({ ...base, classification, unitCost }).unitCost, unitCost)
            assert.equal(updatePackagingSchema.parse({ ...base, classification, unitCost }).unitCost, unitCost)
        }
    }
    for (const unitCost of [-1, Infinity, NaN, 1000000, 0.1234567890123]) {
        assert.equal(createPackagingSchema.safeParse({ ...base, classification: "generic", unitCost }).success, false)
        assert.equal(updatePackagingSchema.safeParse({ ...base, classification: "generic", unitCost }).success, false)
    }
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
    const { buildPdfPackagingMaterials } = h.load("src/feature/quote/util/quotePdfPackaging.ts")
    const { buildPackagingConfiguration } = h.load("src/feature/quote/util/quotePackagingConfig.ts")
    const snapshot = { unitMaterials: [{ displayName: "Bolsa", displayNameEn: "Bag", optionGroup: null }], palletMaterials: [{ displayName: "Caja", displayNameEn: "Box", optionGroup: "Carton", materialType: "CAJA" }] }
    const before = JSON.stringify(snapshot)
    assert.equal(buildPdfPackagingMaterials(snapshot, "es")[0].name, "Bolsa")
    assert.equal(buildPdfPackagingMaterials(snapshot, "en")[0].name, "Bag")
    assert.equal(buildPackagingConfiguration(snapshot, "en")[1].groups[0].material, "Box")
    assert.equal(buildPackagingConfiguration(snapshot, "es")[1].groups[0].material, "Caja")
    assert.equal(JSON.stringify(snapshot), before)
})

for (const language of ["es", "en"]) {
    test(`individual material type selector replaces editable consumption (${language})`, () => {
        const h = harness(language)
        const { PackagingConsumptionFields } = h.load("src/feature/packaging/component/packagingConsumptionFields.component.tsx")
        const registered = []
        const tree = PackagingConsumptionFields({ register: (name, options) => { registered.push(name); return { name, ...options } }, errors: {} })
        assert.deepEqual(registered, ["materialType"])
        const select = nodes(tree).find(node => node.type === "select")
        assert.equal(select.props.required, true)
        assert.deepEqual(nodes(tree).filter(node => node.type === "option").map(node => node.props.value), ["", "CAJA", "TARIMA", "ESQUINERO", "STRETCH", "OTRO"])
        assert.equal(nodes(tree).some(node => node.type === "input"), false)
    })
}

test("the packaging form no longer marks the pallet kit: it is managed in its own section", () => {
    const h = harness("es")
    const { PackagingForm } = h.load("src/feature/packaging/component/packagingForm.component.tsx")
    const tree = nodes(PackagingForm({ register: name => ({ name }), errors: {}, packagingRole: "pallet", classification: "generic" }))
    assert.equal(tree.some(node => node.props?.id === "palletKitType"), false)
    assert.ok(tree.some(node => node.type === "ConsumptionFields"))
})

for (const language of ["es", "en"]) test(`OTHER materials expose existing catalog consumption fields (${language})`, () => {
    const h = harness(language)
    const { PackagingConsumptionFields } = h.load("src/feature/packaging/component/packagingConsumptionFields.component.tsx")
    const registered = []
    const tree = PackagingConsumptionFields({ materialType: "OTRO", register: (name, options) => { registered.push(name); return { name, ...options } }, errors: {} })
    assert.deepEqual(registered, ["materialType", "defaultQuantityBasis", "defaultQuantityValue"])
    const basis = nodes(tree).find(node => node.props?.id === "defaultQuantityBasis")
    assert.deepEqual(nodes(basis).filter(node => node.type === "option").map(node => node.props.value), ["", "per_box", "per_pallet"])
})

test("effective label quantities match production and PDF snapshots without changing material costs", () => {
    const h = harness()
    const { packagingQuantity } = h.load("src/feature/quote/util/quotePackagingQuantity.ts")
    const { buildPdfPackagingMaterials } = h.load("src/feature/quote/util/quotePdfPackaging.ts")
    const { productionMaterials } = h.load("src/feature/quote/util/quoteProductionData.ts")
    const unit = { displayName: "Individual label", quantityPerUnit: 2, totalUnits: 4800, unitCost: 0.02, optionGroup: null }
    const box = { displayName: "Box label", quantityPerPallet: 160, requestedPallets: 5, unitCost: 0.05, optionGroup: null }
    const breakdown = { rawMaterials: [], unitMaterials: [unit], palletMaterials: [box] }
    const before = JSON.stringify(breakdown)
    assert.equal(packagingQuantity(unit), 9600)
    assert.equal(packagingQuantity(box), 800)
    assert.equal(packagingQuantity({}), null)
    assert.deepEqual(Array.from(buildPdfPackagingMaterials(breakdown), row => row.quantity), [9600, 800])
    const production = productionMaterials({ totalUnits: 4800, requestedPallets: 5, breakdown })
    assert.equal(production.unit[0].quantity, 9600)
    assert.equal(production.pallet[0].quantity, 800)
    assert.equal(JSON.stringify(breakdown), before)
    assert.equal(buildPdfPackagingMaterials({}).length, 0)
})

test("individual label quantities respect the persisted precision", () => {
    const h = harness()
    const { createProductVariantUnitMaterialSchema } = h.load("src/feature/product/schema/productVariantUnitMaterial.schema.ts")
    const input = { productVariantId: 1, packagingId: 2, optionGroupId: null, isDefault: false }
    for (const quantityPerUnit of [1, 2, 3, 1.25]) assert.equal(createProductVariantUnitMaterialSchema.safeParse({ ...input, quantityPerUnit }).success, true)
    for (const quantityPerUnit of [0, -1, 1.001, 100000000]) assert.equal(createProductVariantUnitMaterialSchema.safeParse({ ...input, quantityPerUnit }).success, false)
})
