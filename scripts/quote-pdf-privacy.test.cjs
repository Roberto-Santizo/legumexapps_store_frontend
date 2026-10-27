const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")
const React = require("react")

function loadDocument() {
    const file = "src/feature/quote/component/quotePdfDocument.component.tsx"
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText
    const module = { exports: {} }
    const dependencies = {
        react: { useRef: value => ({ current: value }) },
        "@react-pdf/renderer": Object.fromEntries(["Document", "Page", "View", "Text", "Image"].map(name => [name, name])),
        "react-i18next": { useTranslation: () => ({ t: (key, values = {}) => `${key} ${Object.values(values).join(" ")}` }) },
        "@/feature/quote/constant/quotePdfDocument.styles": { quotePdfStyles: {} },
        "@/feature/quote/util/quotePdfSummary": {
            QUOTE_VALIDITY_DAYS: 15,
            calculateQuoteOrderTotal: lines => lines.reduce((sum, line) => sum + line.totalCost, 0),
            calculateQuoteValidUntil: date => date,
            quotePdfDateFormatter: { format: () => "2026-10-16" },
        },
        "@/feature/quote/component/quotePdfPackaging.component": { QuotePdfPackaging: "Packaging" },
        "@/shared/format/currency": { formatCurrency: value => `$${value.toFixed(2)}` },
    }
    vm.runInThisContext(`(function(require,module,exports){${source}\n})`)(
        name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name), module, module.exports,
    )
    return module.exports.QuotePdfDocument
}

function text(node) {
    if (Array.isArray(node)) return node.map(text).join(" ")
    if (React.isValidElement(node)) return text(node.props.children)
    return typeof node === "string" || typeof node === "number" ? String(node) : ""
}

test("commercial PDFs hide internal costs for juice, products and mixed orders by default", () => {
    const Document = loadDocument()
    const juice = {
        productDisplayName: "Carrot pineapple juice", variantLabel: "PAB11030319 · 6X12OZ",
        requestedPallets: 1, totalUnits: 546, boxesPerPallet: 91, totalCost: 209.35,
        rawMaterialCost: 106.29, ingredientCost: 0.05, unitPackagingCost: 12.01,
        intermediatePackagingCost: 0, palletMaterialCost: 91,
        breakdown: { rawMaterials: [{}], ingredients: [{}], unitMaterials: [{}], palletMaterials: [{}] },
    }
    const product = { ...juice, productDisplayName: "Frozen product" }
    const before = JSON.stringify([juice, product])
    for (const lines of [[juice], [product], [juice, product]]) {
        for (const options of [{}, { showCostBreakdown: false }]) {
            const output = text(Document({ clientName: "ACME", quoteDate: new Date("2026-10-16"), lines, ...options }))
            for (const label of ["rawMaterials", "ingredients", "unitPackaging", "palletMaterials", "units"]) {
                assert.ok(!output.includes(`quote.pdf.document.${label}`), label)
            }
            for (const amount of ["$106.29", "$0.05", "$12.01", "$91.00"]) assert.ok(!output.includes(amount), amount)
            assert.ok(output.includes("quote.pdf.document.boxesPerPallet"))
            assert.ok(output.includes("91"))
            assert.ok(output.includes("$209.35"))
            for (const line of lines) assert.ok(output.includes(line.productDisplayName))
        }
    }
    assert.equal(JSON.stringify([juice, product]), before)
    const internal = text(Document({ clientName: "Internal", quoteDate: new Date(), lines: [juice], showCostBreakdown: true }))
    assert.ok(internal.includes("quote.pdf.document.rawMaterials"))
    assert.ok(internal.includes("$106.29"))
})

test("product additional charge stays internal while commercial PDFs retain the complete total", () => {
    const Document = loadDocument()
    const line = {
        productDisplayName: "Fixed product", requestedPallets: 1, totalUnits: 20, boxesPerPallet: 20,
        totalCost: 56, rawMaterialCost: 50,
        breakdown: { rawMaterials: [{}], palletMaterials: [], adjustment: { unitCost: 0.3, totalUnits: 20, lineTotal: 6 } },
    }
    const before = JSON.stringify(line)
    for (const showCostBreakdown of [undefined, false, true]) {
        const output = text(Document({ clientName: "ACME", quoteDate: new Date(), lines: [line], showCostBreakdown }))
        assert.equal(output.split("site.quoteRequest.result.adjustment ").length - 1, showCostBreakdown ? 1 : 0)
        assert.equal(output.includes("$6.00"), Boolean(showCostBreakdown))
        assert.equal(output.includes("$0.30 20"), Boolean(showCostBreakdown))
        assert.ok(output.includes("$56.00"))
        if (!showCostBreakdown) assert.ok(!output.includes("$50.00"))
    }
    const without = { ...line, breakdown: { ...line.breakdown, adjustment: null } }
    assert.ok(!text(Document({ clientName: "ACME", quoteDate: new Date(), lines: [without] })).includes("site.quoteRequest.result.adjustment"))
    assert.equal(JSON.stringify(line), before)
})
