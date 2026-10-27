const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")
const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")
const resources = { es: require("../src/shared/i18n/locales/es/translation.json"), en: require("../src/shared/i18n/locales/en/translation.json") }

function load(file, overrides = {}, cache = new Map()) {
    file = path.resolve(file)
    if (cache.has(file)) return cache.get(file).exports
    const module = { exports: {} }; cache.set(file, module)
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
    const localRequire = name => {
        if (name in overrides) return overrides[name]
        if (name.startsWith("@/") || name.startsWith(".")) {
            const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(file), name)
            return load([`${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate)), overrides, cache)
        }
        return require(name)
    }
    vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(localRequire, module, module.exports)
    return module.exports
}
const translator = language => (key, params = {}) => {
    const lookup = name => name.split(".").reduce((item, part) => item?.[part], resources[language])
    const value = params.count !== undefined ? lookup(`${key}_${params.count === 1 ? "one" : "other"}`) ?? lookup(key) : lookup(key)
    assert.equal(typeof value, "string", `Missing ${language} translation: ${key}`)
    return value.replace(/\{\{(\w+)\}\}/g, (_, name) => params[name] ?? "")
}
const period = () => load("src/feature/dashboard/util/dashboardPeriod.ts")

test("the comparison period is the same number of days right before a closed range, and only exists for closed ranges", () => {
    const { previousRange, inclusiveDays } = period()
    assert.deepEqual(previousRange({ startDate: "2026-09-27", endDate: "2026-10-26" }), { startDate: "2026-08-28", endDate: "2026-09-26" })
    assert.equal(inclusiveDays("2026-08-28", "2026-09-26"), 30)
    assert.deepEqual(previousRange({ startDate: "2026-03-01", endDate: "2026-03-01" }), { startDate: "2026-02-28", endDate: "2026-02-28" })
    assert.equal(previousRange({ startDate: null, endDate: null }), null)
    assert.equal(previousRange({ startDate: "2026-10-01", endDate: null }), null)
    assert.equal(previousRange({ startDate: "2026-10-05", endDate: "2026-10-01" }), null)
})

test("period changes never invent a percentage without a base", () => {
    const { periodChange } = period()
    assert.deepEqual(periodChange(120, 100), { kind: "ratio", value: 0.2 })
    assert.deepEqual(periodChange(0, 0), null)
    assert.deepEqual(periodChange(5, 0), { kind: "new" })
    assert.deepEqual(periodChange(7, 5, "difference"), { kind: "difference", value: 2 })
    const { formatChange, changeDirection } = load("src/feature/dashboard/util/dashboardFormat.ts")
    assert.equal(formatChange({ kind: "ratio", value: 0.125 }, "en"), "+13%")
    assert.equal(formatChange({ kind: "ratio", value: -0.006 }, "en"), "-0.6%")
    assert.equal(formatChange({ kind: "difference", value: 2 }, "en"), "+2")
    assert.equal(changeDirection({ kind: "ratio", value: 0 }), "flat")
})

test("the trend fills empty days and weeks with zero without changing received values", () => {
    const { continuousTrend } = period()
    const points = [{ bucketStart: "2026-10-02", count: 2, revenue: 100.5 }, { bucketStart: "2026-10-05", count: 1, revenue: 30 }]
    const daily = continuousTrend(points, "day", { startDate: "2026-10-01", endDate: "2026-10-06" })
    assert.deepEqual(daily.map(point => point.bucketStart), ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06"])
    assert.equal(daily[1], points[0])
    assert.equal(daily.reduce((sum, point) => sum + point.revenue, 0), 130.5)
    // Open range: limited to the first and last point.
    assert.equal(continuousTrend(points, "day", { startDate: null, endDate: null }).length, 4)
    // Weeks start on Monday, like the backend buckets.
    const weekly = continuousTrend([{ bucketStart: "2026-09-07", count: 1, revenue: 1 }, { bucketStart: "2026-09-28", count: 1, revenue: 2 }], "week", { startDate: "2026-09-09", endDate: "2026-10-01" })
    assert.deepEqual(weekly.map(point => point.bucketStart), ["2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28"])
    assert.deepEqual(continuousTrend([], "day", { startDate: "2026-10-01", endDate: "2026-10-06" }), [])
})

for (const language of ["es", "en"]) test(`overview leads with the quoted value and shows real changes only (${language})`, () => {
    const t = translator(language)
    const { DashboardOverviewSummary } = load("src/feature/dashboard/component/dashboardOverview.component.tsx", { "react-i18next": { useTranslation: () => ({ t, i18n: { language } }) } })
    const overview = { totalQuotes: 61, totalRevenue: 1146981.15, totalPallets: 161, totalUnits: 0, uniqueSalespeople: 7, averageQuoteValue: 18802.97 }
    const withComparison = renderToStaticMarkup(React.createElement(DashboardOverviewSummary, { overview, previous: { ...overview, totalRevenue: 1021400, uniqueSalespeople: 5 }, comparisonRange: { startDate: "2026-08-28", endDate: "2026-09-26" } }))
    assert.ok(withComparison.includes("$1,146,981.15"))
    assert.ok(withComparison.includes(t("dashboard.overview.uniqueSalespeople")))
    assert.ok(withComparison.includes(">+2<"), "representatives use an absolute difference")
    assert.ok(withComparison.includes(t("dashboard.comparison.versusPrevious")))
    const withoutComparison = renderToStaticMarkup(React.createElement(DashboardOverviewSummary, { overview, comparisonRange: null }))
    assert.ok(!withoutComparison.includes(t("dashboard.comparison.versusPrevious")))
    assert.ok(!withoutComparison.includes("%"))
    assert.ok(withoutComparison.includes(t("dashboard.comparison.unavailable")))
})

test("product share keeps entity colors for the top four and folds the rest into Other", () => {
    const t = translator("es")
    const { ProductRevenuePanel } = load("src/feature/dashboard/component/productRevenuePanel.component.tsx", { "react-i18next": { useTranslation: () => ({ t, i18n: { language: "es" } }) } })
    const products = [400, 300, 200, 50, 30, 20].map((revenue, i) => ({ productId: i + 1, productDisplayName: `P${i + 1}`, quoteCount: i + 1, totalUnits: 0, totalPallets: 1, totalRevenue: revenue }))
    const html = renderToStaticMarkup(React.createElement(ProductRevenuePanel, { products, totalRevenue: 1000 }))
    for (const slot of [1, 2, 3, 4]) assert.ok(html.includes(`var(--color-chart-${slot})`))
    assert.ok(html.includes(t("dashboard.productRevenueShare.other")))
    assert.ok(html.includes("P6") && html.includes("$20.00"))
    assert.ok(html.includes("1 cotización"), "singular count")
    const empty = renderToStaticMarkup(React.createElement(ProductRevenuePanel, { products: [], totalRevenue: 0 }))
    assert.ok(empty.includes(t("dashboard.topProducts.empty")) && !empty.includes("<figure"))
})
