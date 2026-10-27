const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")

function load(file) {
    const module = { exports: {} }
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    const localRequire = name => {
        if (name === "react-i18next") return { useTranslation: () => ({ t: key => key }) }
        if (name === "@/shared/i18n/getFieldErrorMessage") return { getFieldErrorMessage: () => undefined }
        if (name === "react-hook-form") return { Controller: "Controller" }
        if (name.startsWith("@/shared/schema/")) return load(path.join("src", name.slice(2) + ".ts"))
        if (name.startsWith("@/") || name.startsWith(".")) return new Proxy({}, { get: (_, key) => key })
        return require(name)
    }
    vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(localRequire, module, module.exports)
    return module.exports
}
const nodes = tree => !tree || typeof tree !== "object" ? []
    : [tree, ...[].concat(tree.props?.children ?? []).flat(Infinity).flatMap(nodes)]

test("individual create/edit schemas retain organic and conventional choices", () => {
    const { createProductSchema, updateProductSchema } = load("src/feature/product/schema/product.schema.ts")
    for (const isOrganic of [true, false]) {
        assert.equal(createProductSchema.parse({ subCategoryId: 1, clientId: 7, displayName: "Piña", isOrganic }).isOrganic, isOrganic)
        assert.equal(updateProductSchema.parse({ clientId: 7, isOrganic }).isOrganic, isOrganic)
    }
    assert.equal(updateProductSchema.parse({ clientId: 7 }).isOrganic, undefined)
})

test("shared individual form registers an editable organic checkbox, including direct-cost products", () => {
    const { ProductForm } = load("src/feature/product/component/productForm.component.tsx")
    for (const directCostsOnly of [false, true]) {
        const changed = []
        const tree = ProductForm({ register: name => ({ name, onChange: event => changed.push(event.target.checked) }), control: {}, errors: {}, directCostsOnly })
        const checkbox = nodes(tree).find(node => node.type === "Checkbox" && node.props.id === "isOrganic")
        assert.ok(checkbox)
        assert.equal(checkbox.props.name, "isOrganic")
        assert.equal(checkbox.props.disabled, undefined)
        checkbox.props.onChange({ target: { checked: true } })
        checkbox.props.onChange({ target: { checked: false } })
        assert.deepEqual(changed, [true, false])
    }
})
