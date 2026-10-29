const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")
const React = require("react")

function transpiled(file, dependencies) {
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText
    const module = { exports: {} }
    vm.runInThisContext(`(function(require,module,exports){${source}\n})`)(
        name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name), module, module.exports,
    )
    return module.exports
}

function loadDocument() {
    // The real amounts guard and order total: representative lines never carry amounts.
    const amounts = transpiled("src/feature/quote/util/quoteAmounts.ts", {})
    const summary = transpiled("src/feature/quote/util/quotePdfSummary.ts", { "@/feature/quote/util/quoteAmounts": amounts })
    const dependencies = {
        react: { useRef: value => ({ current: value }) },
        "@react-pdf/renderer": Object.fromEntries(["Document", "Page", "View", "Text", "Image"].map(name => [name, name])),
        "react-i18next": { useTranslation: () => ({ t: (key, values = {}) => `${key} ${Object.values(values).join(" ")}` }) },
        "@/feature/quote/constant/quotePdfDocument.styles": { quotePdfStyles: {} },
        "@/feature/quote/util/quotePdfSummary": {
            QUOTE_VALIDITY_DAYS: 15,
            calculateQuoteOrderTotal: summary.calculateQuoteOrderTotal,
            calculateQuoteValidUntil: date => date,
            quotePdfDateFormatter: { format: () => "2026-10-16" },
        },
        "@/feature/quote/component/quotePdfPackaging.component": { QuotePdfPackaging: "Packaging" },
        "@/feature/quote/util/quoteAmounts": amounts,
        "@/shared/format/currency": { formatCurrency: value => `$${value.toFixed(2)}` },
    }
    return transpiled("src/feature/quote/component/quotePdfDocument.component.tsx", dependencies).QuotePdfDocument
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
            // Sin precio final aprobado, el costo interno nunca aparece como precio.
            assert.ok(!output.includes("$209.35"))
            assert.ok(output.includes("quote.pendingReview.pdfNotice"))
            for (const line of lines) assert.ok(output.includes(line.productDisplayName))
        }
    }
    assert.equal(JSON.stringify([juice, product]), before)
    const priced = text(Document({ clientName: "ACME", quoteDate: new Date(), lines: [{ ...juice, finalPrice: 250 }] }))
    assert.ok(priced.includes("$250.00") && !priced.includes("$209.35"))
    const internal = text(Document({ clientName: "Internal", quoteDate: new Date(), lines: [juice], showCostBreakdown: true }))
    assert.ok(internal.includes("quote.pdf.document.rawMaterials"))
    assert.ok(internal.includes("$106.29"))
})

test("product additional charge stays internal; commercial PDFs show the final price, never the cost total", () => {
    const Document = loadDocument()
    const line = {
        productDisplayName: "Fixed product", requestedPallets: 1, totalUnits: 20, boxesPerPallet: 20,
        totalCost: 56, rawMaterialCost: 50,
        breakdown: { rawMaterials: [{}], palletMaterials: [], adjustment: { unitCost: 0.3, totalUnits: 20, lineTotal: 6 } },
    }
    const before = JSON.stringify(line)
    for (const showCostBreakdown of [undefined, false, true]) {
        const output = text(Document({ clientName: "ACME", quoteDate: new Date(), lines: [{ ...line, finalPrice: 70 }], showCostBreakdown }))
        assert.equal(output.split("site.quoteRequest.result.adjustment ").length - 1, showCostBreakdown ? 1 : 0)
        assert.equal(output.includes("$6.00"), Boolean(showCostBreakdown))
        assert.equal(output.includes("$0.30 20"), Boolean(showCostBreakdown))
        assert.ok(output.includes("$70.00"))
        if (!showCostBreakdown) assert.ok(!output.includes("$50.00") && !output.includes("$56.00"))
    }
    const without = { ...line, breakdown: { ...line.breakdown, adjustment: null } }
    assert.ok(!text(Document({ clientName: "ACME", quoteDate: new Date(), lines: [without] })).includes("site.quoteRequest.result.adjustment"))
    assert.equal(JSON.stringify(line), before)
})

test("representative PDFs carry no amount at all and say prices are pending management review", () => {
    const Document = loadDocument()
    // What the representative API returns: quantities and names, never an amount.
    const line = { productDisplayName: "Frozen product", variantLabel: "PIN-1 · 1 lb", requestedPallets: 2, totalUnits: 400, boxesPerPallet: 20,
        breakdown: { rawMaterials: [{ rawMaterialId: 1, displayName: "Pineapple", percentage: 100, quantityPerUnit: 1, totalUnits: 400 }], unitMaterials: [], palletMaterials: [] } }
    for (const options of [{}, { showCostBreakdown: true }, { showTransport: true }]) {
        const output = text(Document({ clientName: "ACME", quoteDate: new Date("2026-10-28"), lines: [line, { ...line, productDisplayName: "Second product" }], showReferenceDisclaimer: true, ...options }))
        assert.ok(!output.includes("$"), output)
        for (const label of ["lineTotal", "perPallet", "orderTotal", "rawMaterials"]) assert.ok(!output.includes(`quote.pdf.document.${label}`), label)
        assert.ok(output.includes("quote.pendingReview.pdfNotice"))
        assert.ok(output.includes("Frozen product") && output.includes("Second product"))
        // Same quantity stat as always: boxes per pallet, or total units in the internal variant.
        assert.ok(output.includes(options.showCostBreakdown ? "quote.pdf.document.units" : "quote.pdf.document.boxesPerPallet"))
    }
    // An admin line (with its cost) is priced for the client only by its final price, never by the cost.
    const admin = text(Document({ clientName: "ACME", quoteDate: new Date(), lines: [{ ...line, totalCost: 100 }] }))
    assert.ok(!admin.includes("$") && admin.includes("quote.pendingReview.pdfNotice"))
    const adminPriced = text(Document({ clientName: "ACME", quoteDate: new Date(), lines: [{ ...line, totalCost: 100, finalPrice: 130 }] }))
    assert.ok(adminPriced.includes("$130.00") && adminPriced.includes("$65.00") && !adminPriced.includes("$100.00"))
    assert.ok(!adminPriced.includes("quote.pendingReview.pdfNotice"))
})

test("an approved representative order shows only the final price; a line without one leaves the whole order unpriced", () => {
    const Document = loadDocument()
    const line = { productDisplayName: "Frozen product", variantLabel: "PIN-1", requestedPallets: 2, totalUnits: 400, boxesPerPallet: 20,
        breakdown: { rawMaterials: [{ rawMaterialId: 1, displayName: "Pineapple", quantityPerUnit: 1, totalUnits: 400 }], palletMaterials: [] } }
    const approved = text(Document({ clientName: "ACME", quoteDate: new Date(), lines: [{ ...line, finalPrice: 150 }, { ...line, productDisplayName: "Second", finalPrice: 50 }], showReferenceDisclaimer: true }))
    assert.ok(approved.includes("$150.00") && approved.includes("$75.00") && approved.includes("$200.00"))
    assert.ok(approved.includes("quote.pdf.document.orderTotal"))
    assert.ok(!approved.includes("quote.pendingReview.pdfNotice"))
    for (const label of ["rawMaterials", "unitPackaging", "palletMaterials"]) assert.ok(!approved.includes(`quote.pdf.document.${label}`), label)
    const partial = text(Document({ clientName: "ACME", quoteDate: new Date(), lines: [{ ...line, finalPrice: 150 }, line] }))
    assert.ok(!partial.includes("quote.pdf.document.orderTotal"))
    assert.ok(partial.includes("quote.pendingReview.pdfNotice"))
})
