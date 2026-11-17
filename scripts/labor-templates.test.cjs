const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")
const { createInstance } = require("i18next")

function loader(overrides = {}) {
    const cache = new Map()
    function load(file) {
        file = path.resolve(file)
        if (cache.has(file)) return cache.get(file).exports
        const module = { exports: {} }
        cache.set(file, module)
        const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
        const localRequire = name => {
            if (name in overrides) return overrides[name]
            if (name.startsWith("@/") || name.startsWith(".")) {
                const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(file), name)
                return load([`${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate)))
            }
            return require(name)
        }
        vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(localRequire, module, module.exports)
        return module.exports
    }
    return load
}

// Standalone Excel-derived fixtures: frontend checks do not depend on a sibling repository.
const benefits = [["BONO14", 100 / 12], ["AGUINALDO", 100 / 12], ["INDEMNIZACION", 9.72222222222222], ["VACACIONES", 100 / 24], ["PATRONAL", 12.67]]
    .map(([code, percentage]) => ({ code, displayName: code, percentage, basis: "salary", isActive: true }))
const positions = Array.from({ length: 43 }, (_, index) => ({ code: `1LNDTA${String(index + 1).padStart(3, "0")}`, jobTitle: "RECORTADOR", salaryMonthlyGtq: 2921.9, bonusMonthlyGtq: 250, isActive: true, applicableBenefitCodes: benefits.map(benefit => benefit.code) }))
const line = { code: "1LNDTA", displayName: "LINEA DIRECTA IQF 1 AM V2 (26 R)", shift: "AM", plantName: "Planta 1 / Tejar", revision: 0, isActive: true, positions: positions.slice(0, 32).map(({ code, jobTitle }) => ({ code, jobTitle })) }
const reference = { plantName: line.plantName, lines: [line], settings: { daysPerYear: 366, weeklyHours: 44, benefits }, example: { code: "T-LD1-REC", displayName: "Ejemplo Excel", lineCode: line.code, positions, expectedHourlyCostGtq: 994.7147241737043 } }
const form = loader()("src/feature/rawMaterialTransformation/util/laborTemplateForm.ts")
const schemas = loader()("src/feature/rawMaterialTransformation/schema/laborTemplate.schema.ts")

test("catalog positions start without invented salaries or bonuses; Excel example remains separate", () => {
    const initial = form.initialLaborTemplate(reference, line)
    assert.equal(initial.positions.length, 32)
    assert.ok(initial.positions.every(position => Number.isNaN(position.salaryMonthlyGtq) && Number.isNaN(position.bonusMonthlyGtq)))
    assert.equal(form.laborPreviewPayload(initial), null)
    const example = form.initialLaborTemplate(reference, undefined, true)
    assert.equal(example.positions.length, 43)
    assert.equal(example.positions[0].salaryMonthlyGtq, 2921.9)
    assert.ok(form.laborPreviewPayload(example))
    example.positions[0].salaryMonthlyGtq = 5000
    assert.equal(reference.example.positions[0].salaryMonthlyGtq, 2921.9)
})

test("preview submits only calculation inputs; blank, duplicate or invalid positions cannot calculate", () => {
    const value = form.initialLaborTemplate(reference, undefined, true)
    const payload = form.laborPreviewPayload(value)
    assert.deepEqual(Object.keys(payload).sort(), ["benefits", "calendarMode", "daysPerYear", "positions", "weeklyHours"])
    for (const change of [{ weeklyHours: 0 }, { positions: [...value.positions, value.positions[0]] }, { positions: [{ ...value.positions[0], salaryMonthlyGtq: Number.NaN }] }, { positions: [] }]) {
        assert.equal(form.laborPreviewPayload({ ...value, ...change }), null)
    }
    const zero = { ...value, positions: [{ ...value.positions[0], salaryMonthlyGtq: 0, bonusMonthlyGtq: 0 }] }
    assert.ok(form.laborPreviewPayload(zero))
})

test("ordinary templates use the current Guatemala year while the Excel benchmark keeps its original days", () => {
    for (const [instant, year, days] of [
        ["2028-01-01T05:59:59Z", 2027, 365], ["2028-01-01T06:00:00Z", 2028, 366],
        ["2000-07-01T12:00:00Z", 2000, 366], ["2100-07-01T12:00:00Z", 2100, 365],
    ]) {
        const date = new Date(instant)
        assert.deepEqual(form.currentLaborCalendar(date), { calendarYear: year, daysPerYear: days })
        const initial = form.initialLaborTemplate(reference, line, false, date)
        assert.equal(initial.daysPerYear, days)
        assert.equal(initial.calendarMode, "current_year")
        const example = form.initialLaborTemplate(reference, undefined, true, date)
        assert.equal(example.daysPerYear, 366)
        assert.equal(example.calendarMode, "excel_reference")
    }
})

test("an open form refreshes its calendar at New Year and removes its timer and focus listener", () => {
    let current = { calendarYear: 2027, daysPerYear: 365 }
    let state
    let tick
    let focus
    let cleanup
    let cleared = false
    const originalInterval = global.setInterval
    const originalClear = global.clearInterval
    const originalWindow = global.window
    try {
        global.setInterval = operation => { tick = operation; return 77 }
        global.clearInterval = id => { cleared = id === 77 }
        global.window = { addEventListener: (name, operation) => { assert.equal(name, "focus"); focus = operation }, removeEventListener: (name, operation) => { assert.equal(name, "focus"); assert.equal(operation, focus) } }
        const hook = loader({
            react: { useState: initialize => { state = initialize(); return [state, update => { state = update(state) }] }, useEffect: operation => { cleanup = operation() } },
            "@/feature/rawMaterialTransformation/util/laborTemplateForm": { currentLaborCalendar: () => current },
        })("src/feature/rawMaterialTransformation/hook/useLaborCalendar.ts")
        hook.useLaborCalendar()
        const original = state
        tick()
        assert.equal(state, original)
        current = { calendarYear: 2028, daysPerYear: 366 }
        tick()
        assert.equal(state.daysPerYear, 366)
        current = { calendarYear: 2029, daysPerYear: 365 }
        focus()
        assert.equal(state.calendarYear, 2029)
        cleanup()
        assert.ok(cleared)
    } finally { global.setInterval = originalInterval; global.clearInterval = originalClear; global.window = originalWindow }
})

test("a new year refreshes the preview even when both years have 365 days", () => {
    const requests = []
    const { useLaborTemplatePreview } = loader({
        react: { useState: initial => [initial, () => {}], useEffect() {} },
        "@tanstack/react-query": { useQuery: options => { requests.push(options); return { isError: false, isFetching: false } } },
        "@/feature/rawMaterialTransformation/api/laborTemplate.api": { previewLaborTemplateAPI() {} },
    })("src/feature/rawMaterialTransformation/hook/useLaborTemplatePreview.ts")
    const input = { ...form.initialLaborTemplate(reference, undefined, true), calendarMode: "current_year", daysPerYear: 365 }
    useLaborTemplatePreview(input, 2025)
    useLaborTemplatePreview(input, 2026)
    assert.equal(requests[0].queryKey[1], requests[1].queryKey[1])
    assert.notDeepEqual(requests[0].queryKey, requests[1].queryKey)
    assert.equal(form.laborPreviewPayload(input).calendarYear, undefined)
})

test("saving requires identity, reason, valid date and unique positions, with explicit expected revision", () => {
    const value = { ...form.initialLaborTemplate(reference, undefined, true), changeReason: "Excel reference" }
    assert.ok(schemas.laborTemplateFormSchema.safeParse(value).success)
    for (const patch of [{ code: "" }, { lineCode: "" }, { changeReason: "" }, { effectiveFrom: "2026-02-30" }, { expectedVersion: -1 }]) {
        assert.equal(schemas.laborTemplateFormSchema.safeParse({ ...value, ...patch }).success, false)
    }
    assert.equal(schemas.laborLineSchema.safeParse({ ...line, positions: [...line.positions, line.positions[0]] }).success, false)
})

test("GTQ formatting preserves four hourly decimals", () => {
    assert.equal(form.formatGtq(994.7147241737043, 4), "Q994.7147")
    assert.equal(form.formatGtq(2921.9), "Q2,921.90")
})

test("the familiar Excel summary has annual, weekly and hourly rows in both languages", async () => {
    const i18n = createInstance()
    await i18n.init({ lng: "es", resources: Object.fromEntries(["es", "en"].map(lang => [lang, { translation: require(`../src/shared/i18n/locales/${lang}/translation.json`) }])) })
    for (const lang of ["es", "en"]) {
        await i18n.changeLanguage(lang)
        const { LaborCalculationSummary } = loader({ "react-i18next": { useTranslation: () => ({ t: i18n.getFixedT(lang) }) } })("src/feature/rawMaterialTransformation/component/laborCalculationSummary.component.tsx")
        const flatten = node => !node || typeof node !== "object" ? [node] : [].concat(node.props?.children ?? []).flat(Infinity).flatMap(flatten)
        const values = flatten(LaborCalculationSummary({ daysPerYear: 366, weeklyHours: 44 }))
        for (const key of ["calculationTitle", "annual", "weekly", "hourFactor", "totalHourly"]) assert.ok(values.includes(i18n.t(`laborTemplate.${key}`)))
        for (const key of Object.keys(require("../src/shared/i18n/locales/es/translation.json").laborTemplate)) assert.ok(i18n.exists(`laborTemplate.${key}`, { lng: lang }), key)
    }
})

const savedCalculation = {
    formulaVersion: 1, includedPositions: 1, daysPerYear: 350, weeksPerYear: 50,
    salary: { monthlyGtq: 900, annualGtq: 10800, weeklyGtq: 216, hourlyGtq: 5.4 },
    benefits: { monthlyGtq: 120, annualGtq: 1440, weeklyGtq: 28.8, hourlyGtq: 0.72 },
    bonus: { monthlyGtq: 250, annualGtq: 3000, weeklyGtq: 60, hourlyGtq: 1.5 },
    total: { monthlyGtq: 1270, annualGtq: 15240, weeklyGtq: 304.8, hourlyGtq: 7.62 },
    positions: [{ code: positions[1].code, benefitsMonthlyGtq: 222.22, totalMonthlyGtq: 2222.22 }, { code: positions[0].code, benefitsMonthlyGtq: 111.11, totalMonthlyGtq: 1111.11 }],
}

async function renderLaborComponent(filename, name, props, lang) {
    const React = require("react")
    const { renderToStaticMarkup } = require("react-dom/server")
    const i18n = createInstance()
    await i18n.init({ lng: lang, resources: { [lang]: { translation: require(`../src/shared/i18n/locales/${lang}/translation.json`) } } })
    const component = loader({ "react-i18next": { useTranslation: () => ({ t: i18n.getFixedT(lang), i18n }) } })(filename)[name]
    return { html: renderToStaticMarkup(React.createElement(component, props)), i18n }
}

test("benefit detail keeps ordered columns, readable rates, saved totals and actual applicability in ES/EN", async () => {
    for (const lang of ["es", "en"]) {
        const selected = [positions[0], { ...positions[1], isActive: false }, { ...positions[2], applicableBenefitCodes: [] }]
        const configured = [{ ...benefits[0], basis: "salary_plus_bonus" }, { ...benefits[1], isActive: false }]
        const { html, i18n } = await renderLaborComponent("src/feature/rawMaterialTransformation/component/laborBenefitsSummary.component.tsx", "LaborBenefitsSummary", { benefits: configured, positions: selected, calculation: savedCalculation }, lang)
        const rows = html.match(/<tbody>(.*?)<\/tbody>/s)[1].match(/<tr\b.*?<\/tr>/gs)
        assert.equal(rows.length, 2)
        assert.match(rows[0], /BONO14/)
        assert.ok(rows[0].includes(`${(100 / 12).toLocaleString(lang, { maximumFractionDigits: 4 })}%</td>`))
        assert.ok(rows[0].includes(i18n.t("laborTemplate.salaryBonusBasis")))
        assert.ok(rows[0].includes(i18n.t("laborTemplate.includedCount", { count: 1 })))
        assert.ok(rows[1].includes(i18n.t("laborTemplate.includedCount", { count: 0 })))
        assert.ok(rows[1].includes(i18n.t("laborTemplate.inactive")))
        assert.ok(html.includes("Q120.00"))
        assert.equal(configured[0].percentage, 100 / 12)
    }
})

test("saved position totals follow position codes even when snapshot results have a different order", async () => {
    const data = { line, positions: [positions[0], { ...positions[1], isActive: false, applicableBenefitCodes: [] }], benefits, calculation: savedCalculation }
    for (const lang of ["es", "en"]) {
        const { html, i18n } = await renderLaborComponent("src/feature/rawMaterialTransformation/component/laborSavedPositions.component.tsx", "LaborSavedPositions", { data }, lang)
        const rows = html.match(/<tbody>(.*?)<\/tbody>/s)[1].match(/<tr\b.*?<\/tr>/gs)
        assert.match(rows[0], /Q111\.11/)
        assert.match(rows[0], /Q1,111\.11/)
        assert.match(rows[1], /Q222\.22/)
        assert.match(rows[1], /Q2,222\.22/)
        assert.ok(rows[1].includes(i18n.t("laborTemplate.noBenefits")))
        assert.match(html.match(/<tfoot\b[^>]*>(.*?)<\/tfoot>/s)[1], /Q1,270\.00/)
    }
})

test("detailed cost summary displays saved totals and calendar without recalculating a historical snapshot", async () => {
    for (const lang of ["es", "en"]) {
        const { html, i18n } = await renderLaborComponent("src/feature/rawMaterialTransformation/component/laborCalculationSummary.component.tsx", "LaborCalculationSummary", { result: savedCalculation, daysPerYear: 366, weeklyHours: 40 }, lang)
        assert.ok(html.includes(i18n.t("laborTemplate.annualFormula")))
        assert.ok(html.includes(i18n.t("laborTemplate.weeklyFormula", { weeks: "50" })))
        assert.ok(html.includes(i18n.t("laborTemplate.hourlyFormula", { hours: "40" })))
        for (const amount of ["Q1,270.00", "Q15,240.00", "Q304.80", "Q7.6200", "Q5.4000", "Q0.7200", "Q1.5000"]) assert.ok(html.includes(amount), amount)
        assert.match(html, /350 ÷ 7/)
        assert.ok(!html.includes("366"))
    }
})
