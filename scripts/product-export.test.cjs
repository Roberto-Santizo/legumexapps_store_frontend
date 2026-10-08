const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")

function load(file, overrides) {
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
    const module = { exports: {} }
    vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(name => name in overrides ? overrides[name] : require(name), module, module.exports)
    return module.exports
}
test("catalog export uses authenticated API, downloads a Blob and exposes backend errors", async () => {
    const blob = new Blob(["xlsx"]), calls = []
    let failure
    const overrides = {
        "@/shared/api/api": { __esModule: true, default: { get: async (...args) => { calls.push(args); if (failure) throw failure; return { data: blob } } } },
        "@/shared/api/handleApiError": { handleApiError: error => { throw error } },
    }
    const { exportProductCatalogAPI } = load("src/feature/product/api/productExport.api.ts", overrides)
    assert.equal(await exportProductCatalogAPI(), blob)
    assert.deepEqual(calls[0], ["/products/export", { responseType: "blob" }])
    failure = { isAxiosError: true, response: { data: new Blob([JSON.stringify({ message: "Permission denied" })]) } }
    await assert.rejects(exportProductCatalogAPI(), /Permission denied/)
    failure = new Error("offline")
    await assert.rejects(exportProductCatalogAPI(), /offline/)
})
test("export button disables pending requests, downloads the result and displays errors", () => {
    let options, pending = false, requests = 0
    const downloads = [], errors = []
    const overrides = {
        "@tanstack/react-query": { useMutation: value => { options = value; return { isPending: pending, mutate: () => requests++ } } },
        "react-i18next": { useTranslation: () => ({ t: key => key }) },
        "@/shared/component/button.component": { Button: "button" },
        "@/shared/utils/downloadBlob": { downloadBlob: (...args) => downloads.push(args) },
        "@/shared/i18n/showErrorToast": { showErrorToast: error => errors.push(error) },
        "../api/productExport.api": { exportProductCatalogAPI: async () => {} },
    }
    const { ProductExportButton } = load("src/feature/product/component/productExportButton.component.tsx", overrides)
    let button = ProductExportButton()
    assert.equal(button.props.children, "product.export.button")
    button.props.onClick(); assert.equal(requests, 1)
    pending = true; button = ProductExportButton()
    assert.equal(button.props.disabled, true)
    assert.equal(button.props["aria-busy"], true)
    assert.equal(button.props.children, "product.export.pending")
    const blob = new Blob(["xlsx"])
    options.onSuccess(blob)
    assert.equal(downloads[0][0], blob)
    assert.match(downloads[0][1], /^catalogo-productos-\d{4}-\d{2}-\d{2}\.xlsx$/)
    const error = new Error("failed"); options.onError(error); assert.equal(errors[0], error)
    const page = fs.readFileSync("src/feature/product/page/product.page.tsx", "utf8")
    assert.ok(page.includes('hasPermission("products:view") && <ProductExportButton />'))
    for (const language of ["es", "en"]) {
        const translations = JSON.parse(fs.readFileSync(`src/shared/i18n/locales/${language}/translation.json`, "utf8"))
        assert.ok(translations.product.export.button)
        assert.ok(translations.product.export.pending)
    }
})
