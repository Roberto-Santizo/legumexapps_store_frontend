const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")

function frontend() {
    const calls = []
    const api = { post: async (url, body) => { calls.push({ url, body }); return { data: api.response } }, get: async (url, options) => { calls.push({ url, options }); return { data: api.response } } }
    const cache = new Map()
    function load(file) {
        file = path.resolve(file)
        if (cache.has(file)) return cache.get(file).exports
        const module = { exports: {} }; cache.set(file, module)
        const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
        const localRequire = name => {
            if (name === "@/shared/api/api") return { __esModule: true, default: api }
            if (name === "@/shared/api/handleApiError") return { handleApiError: error => { throw error } }
            if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`)
            if (name.startsWith(".")) return load(path.join(path.dirname(file), `${name}.ts`))
            return require(name)
        }
        vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(localRequire, module, module.exports)
        return module.exports
    }
    return { api, calls, load }
}
const productApi = "src/feature/product/api/initialProductImport.api.ts"
const file = () => new File(["xlsx"], "products.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
const row = { row: 2, skuCode: "NEW", packagingCode: "MP", materialName: "Box", materialType: "CAJA", level: "pallet", group: null, isDefault: false, quantityBasis: "per_box", consumptionRule: "1 por caja", quantityPerPallet: 198, ruleSource: "legacy", quantity: 1, unitCost: 2, action: "new", previous: null, issues: [], warnings: [] }
const summary = { products: 1, variants: 1, unit: 0, intermediate: 0, pallet: 1, errors: 0, warnings: 0 }
const product = { row: 2, productGroup: "G", skuCode: "NEW", displayName: "Product", presentationId: 1, presentation: "Bag", boxesPerPallet: 198, bagsPerBox: 6, unitsPerIntermediatePackage: null }

test("validación del archivo conserva extensión, tamaño y límite", () => {
    const { load } = frontend(); const { isValidImportFile } = load("src/shared/utils/importFile.ts")
    assert.equal(isValidImportFile({ name: "PRODUCTS.XLSX", size: 5 * 1024 * 1024 }), true)
    for (const input of [{ name: "x.xls", size: 1 }, { name: "x.xlsx", size: 0 }, { name: "x.xlsx", size: 5 * 1024 * 1024 + 1 }]) assert.equal(isValidImportFile(input), false)
})
for (const includeMaterials of [false, true]) test(`preview productos ${includeMaterials ? "con materiales" : "archivo antiguo sin materiales"}`, async () => {
    const { api, calls, load } = frontend()
    api.response = { message: "Ready", data: { previewHash: "hash", summary, products: [product], materials: includeMaterials ? [row] : [], issues: [{ sheet: "Productos y Variantes", row: 3, field: "skuCode", message: "Duplicate SKU" }] } }
    const result = await load(productApi).previewInitialProductImportAPI(file())
    assert.equal(result.materials.length, includeMaterials ? 1 : 0)
    assert.equal(result.issues[0].message, "Duplicate SKU")
    assert.equal(calls[0].url, "/products/bulk-import/preview")
    assert.equal(calls[0].body.get("file").name, "products.xlsx")
    assert.equal(calls[0].body.has("previewHash"), false)
})
test("confirmación conjunta conserva hash, endpoint y resultado", async () => {
    const { api, calls, load } = frontend(); api.response = { message: "Imported", data: summary }
    const result = await load(productApi).confirmInitialProductImportAPI(file(), "approved-hash")
    assert.equal(result.data.variants, 1)
    assert.equal(calls[0].url, "/products/bulk-import/confirm")
    assert.equal(calls[0].body.get("previewHash"), "approved-hash")
})
test("error backend conserva detalles de hoja y fila", async () => {
    const { api, load } = frontend(); const details = [{ sheet: "Materiales de Empaque", row: 2, field: "group", message: "Grupo inexistente" }]
    api.post = async () => { throw { isAxiosError: true, response: { data: { message: "Validation failed", details } } } }
    await assert.rejects(load(productApi).confirmInitialProductImportAPI(file(), "hash"), error => error.message === "Validation failed" && error.rowErrors === details)
})
test("fallo sin respuesta conserva error original", async () => {
    const { api, load } = frontend(); const failure = new Error("Network unavailable")
    api.post = async () => { throw failure }
    await assert.rejects(load(productApi).previewInitialProductImportAPI(file()), error => error === failure)
})
test("descarga de plantilla unificada mantiene endpoint y modo blob", async () => {
    const { api, calls, load } = frontend(); api.response = new Blob(["xlsx"])
    await load("src/feature/product/api/product.api.ts").downloadProductImportTemplateAPI()
    assert.equal(calls[0].url, "/products/bulk-import/template")
    assert.equal(calls[0].options.responseType, "blob")
})


test("la página conserva carga inicial y editor sin panel separado", () => {
    const source = fs.readFileSync("src/feature/product/page/product.page.tsx", "utf8")
    assert.ok(source.includes("<InitialProductImportPanel />"))
    assert.ok(source.includes("<ProductTable />"))
    assert.ok(!source.includes("ProductPackagingImportPanel"))
    assert.equal(fs.existsSync("src/feature/product/component/productPackagingImportPanel.component.tsx"), false)
    for (const locale of ["es", "en"]) {
        const messages = JSON.parse(fs.readFileSync(`src/shared/i18n/locales/${locale}/translation.json`, "utf8"))
        assert.equal(messages.productPackagingImport, undefined)
        assert.ok(messages.initialProductImport.downloadTemplate)
        assert.ok(messages.initialProductImport.levels.pallet)
    }
})


test("selector compartido muestra nombre/reset y abre input oculto sin alterar accept", () => {
    const module = { exports: {} }
    const source = ts.transpileModule(fs.readFileSync("src/shared/component/importFilePicker.component.tsx", "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    const Button = () => null
    const mockRequire = name => {
        if (name === "react-i18next") return { useTranslation: () => ({ t: key => ({ "common.chooseFile": "Choose File", "common.noFileChosen": "No file chosen" })[key] }) }
        if (name === "@/shared/component/button.component") return { Button }
        return require(name)
    }
    vm.runInThisContext(`(function(require,module,exports){${source}\n})`)(mockRequire, module, module.exports)
    const Picker = module.exports.ImportFilePicker
    let clicks = 0
    const inputRef = { current: { click: () => clicks++ } }
    const onChange = () => {}
    const render = (fileName, disabled = false) => Picker({ inputRef, fileName, accept: ".xlsx", disabled, onChange }).props.children
    const [input, button, name] = render("carga_productos.xlsx")
    assert.equal(input.props.className, "hidden")
    assert.equal(input.props.accept, ".xlsx")
    assert.equal(input.props.onChange, onChange)
    assert.equal(button.type, Button)
    button.props.onClick()
    assert.equal(clicks, 1)
    assert.equal(name.props.children, "carga_productos.xlsx")
    assert.equal(render("otra.xlsx")[2].props.children, "otra.xlsx")
    assert.equal(render(undefined)[2].props.children, "No file chosen")
    assert.equal(render(undefined, true)[0].props.disabled, true)
    assert.equal(render(undefined, true)[1].props.disabled, true)
})
