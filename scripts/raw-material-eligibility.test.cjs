const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")
const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")

function load(file, resolve) {
    const exports = {}
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: {
        module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText
    vm.runInNewContext(code, { exports, require: resolve }, { filename: file })
    return exports
}
function schemas() {
    const base = load("src/shared/schema/baseCatalog.schema.ts", () => require("zod"))
    return load("src/feature/rawMaterial/schema/rawMaterial.schema.ts", name => {
        if (name === "zod") return require("zod")
        if (name === "@/shared/schema/baseCatalog.schema") return base
        throw new Error(`Unexpected schema dependency: ${name}`)
    })
}
test("raw-material inputs/responses retire eligibility and organic classification while preserving cost", () => {
    const contract = schemas()
    const input = { code: "SYN-001", displayName: "Raw A", ingredientType: "fruit", costPerUnit: 1.2345 }
    for (const name of ["createRawMaterialSchema", "updateRawMaterialSchema"]) {
        for (const legacy of [true, false, undefined]) {
            const parsed = contract[name].parse({ ...input, isMixable: legacy, isOrganic: legacy })
            assert.equal(parsed.costPerUnit, 1.2345)
            assert.equal(Object.hasOwn(parsed, "isOrganic"), false)
            assert.equal(Object.hasOwn(parsed, "isMixable"), false)
        }
        assert.equal(contract[name].safeParse({ ...input, costPerUnit: -1 }).success, false)
    }
    const response = { ...input, id: 1, isActive: true, createdAt: "2026-10-14", updatedAt: "2026-10-14", urlSlug: "raw-a", costUnitId: 1, translations: [] }
    for (const value of [response, { ...response, isMixable: false, isOrganic: true }]) {
        const parsed = contract.responseRawMaterialSchema.parse(value)
        assert.equal(Object.hasOwn(parsed, "isMixable"), false)
        assert.equal(Object.hasOwn(parsed, "isOrganic"), false)
    }
})

function selector() {
    const records = [
        { id: 1, displayName: "Raw A", ingredientType: "fruit", isMixable: false },
        { id: 2, displayName: "Raw B", ingredientType: "fruit" },
        { id: 3, displayName: "Raw C", ingredientType: "other" },
    ]
    const rawApi = () => { throw new Error("Network calls forbidden") }
    let observed
    const component = load("src/feature/rawMaterial/component/rawMaterialSelect.component.tsx", name => {
        if (name === "react/jsx-runtime") return require(name)
        if (name === "@tanstack/react-query") return { useQuery: options => { observed = options; return { data: { data: records } } } }
        if (name === "react-i18next") return { useTranslation: () => ({ t: key => key }) }
        if (name === "@/feature/rawMaterial/api/rawMaterial.api") return { getRawMaterialsAPI: rawApi }
        if (name === "@/shared/component/catalogCreatableSelect.component") return { CatalogCreatableSelect: props => React.createElement("select", {}, props.options.map(option => React.createElement("option", { key: option.value, value: option.value }, option.label))) }
        if (name === "@/feature/rawMaterial/component/createRawMaterialModal.component") return { CreateRawMaterialModal: () => null }
        throw new Error(`Unexpected selector dependency: ${name}`)
    })
    const html = renderToStaticMarkup(React.createElement(component.RawMaterialSelect, {}))
    assert.equal(observed.queryFn, rawApi)
    assert.equal(JSON.stringify(observed.queryKey), '["rawMaterials"]')
    return html
}
test("raw selector offers every raw material by name only, using only the raw-material API", () => {
    const html = selector()
    for (const name of ["Raw A", "Raw B", "Raw C"]) assert.ok(html.includes(`>${name}</option>`))
})
