const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")
const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")
const jsxRuntime = require("react/jsx-runtime")

// Render with React's actual hook dispatcher, while retaining host-element handlers for assertions.
function componentRenderer() {
    const nodes = []
    const runtime = Object.fromEntries(["jsx", "jsxs"].map(name => [name, (...args) => {
        const node = jsxRuntime[name](...args)
        nodes.push(node)
        return node
    }]))
    function load(file, overrides) {
        const module = { exports: {} }
        const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
        }).outputText
        const localRequire = name => name === "react/jsx-runtime" ? runtime : name in overrides ? overrides[name] : require(name)
        vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(localRequire, module, module.exports)
        return module.exports
    }
    function render(Component, props) {
        nodes.length = 0
        const html = renderToStaticMarkup(React.createElement(Component, props))
        return { nodes: [...nodes], html }
    }
    return { load, render }
}

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
const laborApi = "src/feature/rawMaterialTransformation/api/laborImport.api.ts"
const file = () => new File(["xlsx"], "products.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
const row = { row: 2, skuCode: "NEW", packagingCode: "MP", materialName: "Box", materialType: "CAJA", level: "pallet", group: null, isDefault: false, quantityBasis: "per_box", consumptionRule: "1 por caja", quantityPerPallet: 198, ruleSource: "legacy", quantity: 1, unitCost: 2, action: "new", previous: null, issues: [], warnings: [] }
const summary = { products: 1, variants: 1, unit: 0, intermediate: 0, pallet: 1, errors: 0, warnings: 0 }
const product = { row: 2, productGroup: "G", skuCode: "NEW", displayName: "Product", presentationId: 1, presentation: "Bag", boxesPerPallet: 198, bagsPerBox: 6, unitsPerIntermediatePackage: null }

const laborPreview = { previewHash: "a".repeat(64), summary: { selected: 1, templates: 1, positions: 2, includedPositions: 2, errors: 0 }, issues: [], templates: [{ code: "MOD-LINE", displayName: "Real line", lineCode: "LINE", positions: 2, includedPositions: 2, monthlyCostGtq: 2400, hourlyCostGtq: 13.808219178082 }] }

test("HR workbook download and review preserve file/hash transport and backend-calculated GTQ costs", async () => {
    const { api, calls, load } = frontend()
    api.response = new Blob(["xlsx"])
    await load(laborApi).downloadLaborImportTemplateAPI()
    assert.equal(calls[0].url, "/labor-templates/bulk-import/template")
    assert.equal(calls[0].options.responseType, "blob")
    api.response = { data: laborPreview }
    const result = await load(laborApi).previewLaborImportAPI(file())
    assert.equal(result.templates[0].hourlyCostGtq, 13.808219178082)
    assert.equal(calls[1].url, "/labor-templates/bulk-import/preview")
    assert.deepEqual([...calls[1].body.keys()], ["file"])
    api.response = { message: "Imported", data: { created: 1, positions: 2 } }
    await load(laborApi).confirmLaborImportAPI(file(), laborPreview.previewHash)
    assert.equal(calls[2].url, "/labor-templates/bulk-import/confirm")
    assert.equal(calls[2].body.get("previewHash"), laborPreview.previewHash)
    assert.deepEqual([...calls[2].body.keys()], ["file", "previewHash"])
})

test("HR import exposes backend sheet, row and field errors without discarding their context", async () => {
    const { api, load } = frontend()
    const details = [{ sheet: "Sueldos", row: 17, field: "Salario mensual (GTQ)", message: "Required salary" }]
    api.post = async () => { throw { isAxiosError: true, response: { data: { message: "No data saved", details } } } }
    await assert.rejects(load(laborApi).confirmLaborImportAPI(file(), laborPreview.previewHash), error => error.rowErrors === details)
})

test("changing the HR file clears its reviewed preview; invalid and busy files cannot confirm", () => {
    const h = componentRenderer()
    let stateIndex = 0
    let mutationIndex = 0
    const states = []
    const options = []
    const requests = []
    const invalidated = []
    const mutations = Array.from({ length: 3 }, (_, index) => ({ isPending: false, error: null, reset() { this.error = null }, mutate(value) { requests.push({ index, value }) } }))
    const { LaborImportPanel } = h.load("src/feature/rawMaterialTransformation/component/laborImportPanel.component.tsx", {
        react: { useState: initial => { const index = stateIndex++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = value }] }, useRef: () => ({ current: { value: "previous" } }) },
        "@tanstack/react-query": { useQueryClient: () => ({ invalidateQueries: query => invalidated.push(query.queryKey) }), useMutation: configuration => { const index = mutationIndex++; options[index] = configuration; return mutations[index] } },
        "react-i18next": { useTranslation: () => ({ t: key => key }) },
        "lucide-react": { Download: "svg", FileCheck: "svg", Upload: "svg" },
        sonner: { toast: { success() {} } },
        "@/feature/rawMaterialTransformation/api/laborImport.api": { downloadLaborImportTemplateAPI() {}, previewLaborImportAPI() {}, confirmLaborImportAPI() {} },
        "@/feature/rawMaterialTransformation/util/laborTemplateForm": { formatGtq: value => `Q${value.toFixed(4)}` },
        "@/shared/api/bulkImport.api": { BulkImportApiError: class extends Error {} },
        "@/shared/component/bulkImportPanel.component": { CollapsibleImportCard: "import-card" },
        "@/shared/component/importInstructions.component": { ImportInstructions: "instructions" },
        "@/shared/component/importFilePicker.component": { ImportFilePicker: "file-picker" },
        "@/shared/component/button.component": { Button: "button" },
        "@/shared/component/table.component": { Table: "table", TableBody: "tbody", TableContainer: "table-container", TableHead: "thead", TableRow: "tr", Td: "td", Th: "th" },
        "@/shared/utils/downloadBlob": { downloadBlob() {} },
        "@/shared/utils/importFile": { isValidImportFile: value => value.name.endsWith(".xlsx") && value.size > 0 && value.size <= 5 * 1024 * 1024 },
        "@/shared/i18n/showErrorToast": { showErrorToast() {} },
    })
    const render = () => { stateIndex = 0; mutationIndex = 0; return h.render(LaborImportPanel) }
    const button = (view, key) => view.nodes.find(node => node.type === "button" && [].concat(node.props.children).includes(key))
    const picker = view => view.nodes.find(node => node.type === "file-picker")
    const valid = file()
    picker(render()).props.onFileSelect(valid)
    button(render(), "laborImport.validate").props.onClick()
    assert.deepEqual(requests, [{ index: 1, value: valid }])
    options[1].onSuccess(laborPreview)
    assert.equal(button(render(), "laborImport.confirm").props.disabled, false)
    for (const patch of [{ summary: { ...laborPreview.summary, errors: 1 } }, { summary: { ...laborPreview.summary, templates: 0 } }, { issues: [{ sheet: "Sueldos", row: 2, field: "salary", message: "Invalid" }] }]) {
        options[1].onSuccess({ ...laborPreview, ...patch })
        assert.equal(button(render(), "laborImport.confirm").props.disabled, true)
    }
    options[1].onSuccess(laborPreview)
    const ready = render()
    button(ready, "laborImport.confirm").props.onClick()
    assert.deepEqual(requests[1], { index: 2, value: { file: valid, hash: laborPreview.previewHash } })
    mutations[2].isPending = true
    assert.equal(picker(render()).props.disabled, true)
    mutations[2].isPending = false
    picker(render()).props.onFileSelect(new File(["x"], "different.xlsx"))
    assert.ok(!render().nodes.some(node => node.type === "button" && [].concat(node.props.children).includes("laborImport.confirm")))
    picker(render()).props.onFileSelect(new File(["x"], "wrong.xls"))
    assert.equal(picker(render()).props.file, null)
    assert.ok(render().html.includes("laborImport.fileError"))
    options[2].onSuccess({ message: "Imported" })
    assert.deepEqual(invalidated, [["laborTemplates"], ["laborLines"]])
})

test("the labor list offers the HR importer only to users allowed to create labor templates", () => {
    const h = componentRenderer()
    let permissions = []
    const { LaborTemplatesPage } = h.load("src/feature/rawMaterialTransformation/page/laborTemplates.page.tsx", {
        "react-router-dom": { Link: "a" }, "react-i18next": { useTranslation: () => ({ t: key => key }) },
        "@/feature/rawMaterialTransformation/api/laborTemplate.api": { getLaborTemplatesAPI() {} },
        "@/feature/rawMaterialTransformation/util/laborTemplateForm": { formatGtq: value => value },
        "@/feature/rawMaterialTransformation/component/laborImportPanel.component": { LaborImportPanel: "labor-import" },
        "@/shared/component/pageContainer.component": { PageContainer: "main" },
        "@/shared/component/paginatedAdminTable.component": { PaginatedAdminTable: "admin-table" },
        "@/shared/auth/usePermission": { usePermission: () => ({ hasPermission: permission => permissions.includes(permission) }) },
        "@/shared/utils/buttonClassName": { buttonClassName: () => "" },
    })
    for (const allowed of [[], ["laborTemplates:view"], ["laborTemplates:create"]]) {
        permissions = allowed
        assert.equal(h.render(LaborTemplatesPage).nodes.filter(node => node.type === "labor-import").length, allowed.includes("laborTemplates:create") ? 1 : 0)
    }
    for (const lang of ["es", "en"]) {
        const messages = JSON.parse(fs.readFileSync(`src/shared/i18n/locales/${lang}/translation.json`, "utf8")).laborImport
        for (const key of ["download", "validate", "confirm", "fileError", "confirmHelp"]) assert.ok(messages[key])
    }
})

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
    const h = componentRenderer()
    const translation = { useTranslation: () => ({ t: key => key }) }
    const { ProductBulkImportSection } = h.load("src/feature/product/component/productBulkImportSection.component.tsx", {
        "react-i18next": translation,
        "lucide-react": { ChevronDown: "svg", FileUp: "svg", ListChecks: "svg" },
        "@/shared/component/bulkImportPanel.component": { BulkImportPanel: "bulk-panel" },
        "@/feature/product/component/initialProductImportPanel.component": { InitialProductImportPanel: "initial-panel" },
    })
    let permissions = []
    const rawMaterials = { bulkImportProductRawMaterialsAPI() {}, downloadProductRawMaterialImportTemplateAPI() {} }
    const ingredients = { bulkImportProductIngredientsAPI() {}, downloadProductIngredientImportTemplateAPI() {} }
    const { ProductListPage } = h.load("src/feature/product/page/product.page.tsx", {
        "react-router-dom": { Link: "a" }, "react-i18next": translation,
        "@/feature/product/component/productTable.component": { ProductTable: "product-table" },
        "@/feature/product/component/productExportButton.component": { ProductExportButton: "product-export" },
        "@/feature/product/component/productBulkImportSection.component": { ProductBulkImportSection },
        "@/feature/product/api/productRawMaterial.api": rawMaterials,
        "@/feature/product/api/productIngredient.api": ingredients,
        "@/shared/auth/usePermission": { usePermission: () => ({ hasPermission: permission => permissions.includes(permission) }) },
        "@/shared/component/pageContainer.component": { PageContainer: ({ children }) => React.createElement("main", null, children) },
        "@/shared/utils/buttonClassName": { buttonClassName: () => "" },
    })
    const previousStorage = globalThis.localStorage
    try {
        globalThis.localStorage = { getItem: () => "1" }
        for (const [allowed, expectedSteps] of [
            [[], []], [["products:create"], [1]], [["products:edit"], [2, 3]], [["products:create", "products:edit"], [1, 2, 3]],
        ]) {
            permissions = allowed
            const { nodes } = h.render(ProductListPage)
            assert.equal(nodes.filter(node => node.type === "product-table").length, 1)
            const section = nodes.find(node => node.type === ProductBulkImportSection)
            assert.deepEqual(section?.props.steps.map(item => item.step) ?? [], expectedSteps)
            const initial = nodes.filter(node => node.type === "initial-panel")
            assert.equal(initial.length, expectedSteps.includes(1) ? 1 : 0)
            if (initial.length) assert.equal(initial[0].props.bare, true)
            const panels = nodes.filter(node => node.type === "bulk-panel")
            assert.equal(panels.length, expectedSteps.includes(2) ? 2 : 0)
            if (panels.length) {
                assert.equal(panels[0].props.bulkImport, rawMaterials.bulkImportProductRawMaterialsAPI)
                assert.equal(panels[1].props.bulkImport, ingredients.bulkImportProductIngredientsAPI)
            }
            const tabs = nodes.filter(node => node.props.role === "tab")
            assert.equal(tabs.length, expectedSteps.length)
            if (tabs.length) assert.equal(tabs.filter(node => node.props["aria-selected"]).length, 1)
            const tabPanels = nodes.filter(node => node.props.role === "tabpanel")
            assert.deepEqual(tabPanels.map(node => node.props.hidden), expectedSteps.map((_, index) => index !== 0))
        }
    } finally {
        if (previousStorage === undefined) delete globalThis.localStorage
        else globalThis.localStorage = previousStorage
    }
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
    const h = componentRenderer()
    const { ImportFilePicker } = h.load("src/shared/component/importFilePicker.component.tsx", {
        "react-i18next": { useTranslation: () => ({ t: key => key }) },
        "lucide-react": { FileSpreadsheet: "svg", UploadCloud: "svg", X: "svg" },
    })
    let clicks = 0
    const selected = []
    const inputRef = { current: { click: () => clicks++, value: "previous-selection" } }
    const render = (file, disabled = false) => h.render(ImportFilePicker, { inputRef, file, accept: ".xlsx", disabled, onFileSelect: value => selected.push(value) })
    const first = new File(["synthetic"], "carga_productos.xlsx")
    const loaded = render(first)
    const input = loaded.nodes.find(node => node.type === "input")
    assert.equal(input.props.className, "hidden")
    assert.equal(input.props.type, "file")
    assert.equal(input.props.accept, ".xlsx")
    assert.equal(input.props.ref, inputRef)
    loaded.nodes.find(node => node.type === "button" && node.props.children === "common.changeFile").props.onClick()
    assert.equal(clicks, 1)
    assert.ok(loaded.html.includes(first.name))
    const next = new File(["other"], "otra.xlsx")
    input.props.onChange({ target: { files: [next] } })
    assert.equal(selected.at(-1), next)
    assert.ok(render(next).html.includes(next.name))
    loaded.nodes.find(node => node.props["aria-label"] === "common.removeFile").props.onClick()
    assert.equal(inputRef.current.value, "")
    assert.equal(selected.at(-1), null)
    input.props.onChange({ target: { files: [] } })
    assert.equal(selected.at(-1), null)
    const empty = render(null)
    assert.ok(empty.html.includes("common.dropFileHere") && empty.html.includes("common.browseFile"))
    const dropzone = empty.nodes.find(node => node.type === "button")
    dropzone.props.onClick()
    assert.equal(clicks, 2)
    let prevented = 0
    dropzone.props.onDrop({ preventDefault: () => prevented++, dataTransfer: { files: [next] } })
    assert.equal(prevented, 1)
    assert.equal(selected.at(-1), next)
    const count = selected.length
    dropzone.props.onDrop({ preventDefault() {}, dataTransfer: { files: [] } })
    assert.equal(selected.length, count)
    for (const file of [null, first]) {
        const disabled = render(file, true).nodes
        assert.equal(disabled.find(node => node.type === "input").props.disabled, true)
        assert.ok(disabled.filter(node => node.type === "button").every(node => node.props.disabled === true))
        const drop = disabled.find(node => node.props.onDrop)
        if (drop) drop.props.onDrop({ preventDefault() {}, dataTransfer: { files: [next] } })
        assert.equal(selected.length, count)
    }
})
