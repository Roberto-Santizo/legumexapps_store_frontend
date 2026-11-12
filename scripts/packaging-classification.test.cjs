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
    let slots = []; let cursor = 0
    const scopes = new Map()
    const t = (key, values = {}) => {
        const value = key.split(".").reduce((node, part) => node?.[part], resources[lang])
        assert.equal(typeof value, "string", `Missing translation ${lang}:${key}`)
        return value.replace(/{{(\w+)}}/g, (match, name) => values[name] ?? match)
    }
    const overrides = {
        react: { ...React, useState: initial => { const stateSlots = slots; const index = cursor++; if (!(index in stateSlots)) stateSlots[index] = initial; return [stateSlots[index], value => { stateSlots[index] = value }] } },
        "react-i18next": { useTranslation: () => ({ t, i18n: { language: lang } }) },
        "@/shared/component/select.component": { Select: "select" },
        "@/shared/component/formField.component": { FormField: "FormField" },
        "@/shared/component/paginatedAdminTable.component": { PaginatedAdminTable: "Table" },
        "@/shared/component/editLink.component": { EditLink: "EditLink" },
        "@/shared/i18n/getFieldErrorMessage": { getFieldErrorMessage: () => undefined },
        "./packagingBaseFields.component": { PackagingBaseFields: "BaseFields" },
        "./packagingConsumptionFields.component": { PackagingConsumptionFields: "ConsumptionFields" },
        "@/shared/component/registeredField.component": { RegisteredField: "RegisteredField" },
        "@/shared/component/input.component": { Input: "Input" },
        "@/shared/component/button.component": { Button: "Button" },
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
    return { load, setLanguage: value => { lang = value }, render: (fn, scope = "root") => {
        if (!scopes.has(scope)) scopes.set(scope, [])
        slots = scopes.get(scope); cursor = 0; return fn()
    } }
}
function quantityEditor(h, tree) {
    const editor = nodes(tree).find(node => typeof node.type === "function" && node.type.name === "PackagingQuantityEditor")
    return h.render(() => editor.type(editor.props), editor.props.id)
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
for (const language of ["es", "en"]) {
    test(`volume costs share one section with four inclusive upper limits (${language})`, () => {
        const h = harness(language)
        const { PackagingVolumePricingFields } = h.load("src/feature/packaging/component/packagingVolumePricingFields.component.tsx")
        const props = { register: name => ({ name }), watch: () => undefined, setValue: () => {}, errors: {}, classification: "specific", idPrefix: "quick-" }
        const tree = PackagingVolumePricingFields(props)
        const fields = nodes(tree).filter(node => node.type === "RegisteredField")
        assert.deepEqual(fields.map(field => field.props.name), ["unitCost", "mediumVolumeUnitCost", "highVolumeUnitCost", "fourthVolumeUnitCost"])
        assert.equal(fields[0].props.required, true)
        assert.equal(fields[0].props.id, "quick-unitCost")
        assert.equal(fields[1].props.registerOptions.setValueAs("0"), 0)
        assert.equal(fields[1].props.registerOptions.setValueAs(""), null)
        const limits = nodes(tree).filter(node => typeof node.type === "function" && node.type.name === "PackagingVolumeLimit")
        assert.deepEqual(limits.map(node => [node.props.tier, node.props.suggestedMaximum]), [["low", 5000], ["medium", 10000], ["high", 15000], ["fourth", 20000]])
        const generic = PackagingVolumePricingFields({ ...props, classification: "generic" })
        assert.deepEqual(nodes(generic).filter(node => node.type === "RegisteredField").map(node => node.props.name), ["unitCost"])
        assert.ok(JSON.stringify(generic).includes(resources[language].packaging.volumePricing.genericHint))
    })
}

for (const [tier, suggested] of [["low", 5000], ["medium", 10000], ["high", 15000], ["fourth", 20000]]) {
    test(`${tier} upper limit is editable independently of optional costs and survives closing`, () => {
        const h = harness()
        const { PackagingVolumePricingFields } = h.load("src/feature/packaging/component/packagingVolumePricingFields.component.tsx")
        const field = tier + "VolumeMaximumQuantity"
        const values = {}
        const props = { register: name => ({ name }), watch: name => values[name], setValue: (name,value) => { values[name]=value }, errors: {}, idPrefix: "quick-" }
        const node = nodes(PackagingVolumePricingFields(props)).find(node => node.props?.tier === tier)
        const render = () => h.render(() => node.type(node.props))
        assert.equal(nodes(render()).find(node => node.type === "input").props.defaultValue, suggested)
        nodes(quantityEditor(h,render())).find(node => node.type === "Button").props.onClick()
        let editor = nodes(quantityEditor(h,render())).find(node => node.type === "Input")
        assert.equal(editor.props.id, "quick-"+field)
        assert.equal(editor.props.value, String(suggested))
        editor.props.onChange({target:{value:String(suggested+1000)}})
        assert.equal(values[field],suggested+1000)
        nodes(quantityEditor(h,render())).find(node => node.type === "Button").props.onClick()
        assert.equal(nodes(quantityEditor(h,render())).filter(node => node.type === "Input").length,0)
        nodes(quantityEditor(h,render())).find(node => node.type === "Button").props.onClick()
        editor=nodes(quantityEditor(h,render())).find(node => node.type === "Input")
        assert.equal(editor.props.value,String(suggested+1000))
        editor.props.onChange({target:{value:""}})
        assert.equal(Number.isNaN(values[field]),true,"blank edited bounds must fail numeric validation")
        nodes(quantityEditor(h,render())).find(node => node.type === "Button").props.onClick()
        assert.equal(nodes(quantityEditor(h,render())).find(node => node.type === "Input").props.value, "", "blank bounds must remain editable instead of showing zero")
        assert.doesNotMatch(JSON.stringify(PackagingVolumePricingFields(props)), /NaN/, "a missing bound must not appear as NaN in the next tier")
    })
}

for (const language of ["es", "en"]) {
    test(`volume help uses edited limits and explains their order (${language})`, () => {
        const h = harness(language)
        const { PackagingVolumePricingFields } = h.load("src/feature/packaging/component/packagingVolumePricingFields.component.tsx")
        const values = { lowVolumeMaximumQuantity: 6000, mediumVolumeMaximumQuantity: 30000, highVolumeMaximumQuantity: 40000, fourthVolumeMaximumQuantity: 50000 }
        const props = { register: name => ({ name }), watch: name => values[name], setValue() {}, errors: {} }
        const tree = PackagingVolumePricingFields(props)
        const content = JSON.stringify(tree)
        assert.ok(content.includes((30000).toLocaleString(language)))
        assert.ok(content.includes((6000).toLocaleString(language)))
        assert.doesNotMatch(content, /{{low}}|{{medium}}|25,000|5,000/)
        const invalidProps = { ...props, errors: { mediumVolumeMaximumQuantity: { type: "custom", message: "errors.packaging_volume_pricing_order" } } }
        const limit = nodes(PackagingVolumePricingFields(invalidProps)).find(node => node.props?.tier === "medium")
        const editor = quantityEditor(h, h.render(() => limit.type(limit.props)))
        assert.ok(JSON.stringify(editor).includes(resources[language].errors.packaging_volume_pricing_order))
        assert.equal(nodes(editor).find(node => node.type === "Input").props["aria-describedby"], "mediumVolumeMaximumQuantity-error")
    })

    test(`table shows inclusive limits and explicit zero only for specific materials (${language})`, () => {
        const h = harness(language, { "@/feature/packaging/api/packaging.api": { getPackagingsPaginatedAPI() {} } })
        const { PackagingTable } = h.load("src/feature/packaging/component/packagingTable.component.tsx")
        const table = nodes(h.render(PackagingTable)).find(node => node.type === "Table")
        const column = table.props.columns.find(column => column.key === "unitCost")
        const material = { classification: "specific", unitCost: 3, lowVolumeMaximumQuantity: 6000, mediumVolumeMaximumQuantity: 30000, mediumVolumeMinimumQuantity: 25000, mediumVolumeUnitCost: 0, highVolumeUnitCost: 0.123456789012 }
        const text = JSON.stringify(column.render(material))
        assert.ok(text.includes((6000).toLocaleString(language)))
        assert.ok(text.includes((30000).toLocaleString(language)))
        assert.ok(text.includes("$0.00"))
        assert.ok(text.includes("$0.123456789012"))
        assert.doesNotMatch(text, /25[,.]000/)
        assert.equal(nodes(column.render({ ...material, classification: "generic" })).filter(node => node.type === "p").length, 0)
    })
}

test("schemas accept optional prices while rejecting invalid inclusive limits", () => {
    const { createPackagingSchema,updatePackagingSchema,responsePackagingSchema }=harness().load("src/feature/packaging/schema/packaging.schema.ts")
    const base={code:"BAG-1",displayName:"Bag",displayNameEn:"Bag",classification:"specific",packagingRole:"unit",unitCost:3}
    const tiers={lowVolumeMaximumQuantity:5000,mediumVolumeMaximumQuantity:25000,mediumVolumeUnitCost:2,highVolumeUnitCost:1}
    for(const schema of [createPackagingSchema,updatePackagingSchema]){
        for(const fields of [{},tiers,{mediumVolumeUnitCost:0},{highVolumeUnitCost:0},{...tiers,mediumVolumeUnitCost:null},{...tiers,mediumVolumeUnitCost:3,highVolumeUnitCost:3}])assert.equal(schema.safeParse({...base,...fields}).success,true)
        for(const fields of [{...tiers,mediumVolumeMaximumQuantity:5000},{...tiers,lowVolumeMaximumQuantity:30000},{...tiers,mediumVolumeMaximumQuantity:NaN},{...tiers,mediumVolumeUnitCost:-1},{...tiers,highVolumeUnitCost:0.1234567890123}])assert.equal(schema.safeParse({...base,...fields}).success,false)
        assert.equal(schema.safeParse({...base,classification:"generic",...tiers}).success,false)
    }
    const response={...base,...tiers,id:1,isActive:true,createdAt:"2026-11-11",updatedAt:"2026-11-11",materialType:"INDIVIDUAL"}
    assert.equal(responsePackagingSchema.parse(response).mediumVolumeMaximumQuantity,25000)
    assert.equal(responsePackagingSchema.safeParse({...response,mediumVolumeMaximumQuantity:"25000"}).success,false)
})


test("volume pricing translations preserve Spanish accents and readable separators", () => {
    assert.equal(resources.es.packaging.volumePricing.minimum, "Cantidad mínima de material")
    assert.ok(resources.es.packaging.volumePricing.hint.includes("según"))
    for (const language of ["es", "en"]) {
        assert.ok(resources[language].packaging.volumePricing.applied.includes("·"))
        assert.doesNotMatch(Object.values(resources[language].packaging.volumePricing).join("\n"), /[?\uFFFD]/)
    }
})

test("editing loads existing tiers, preserves zero and explicitly clears tiers when becoming generic", async () => {
    const material = { id: 1, code: "BAG-1", classification: "specific", packagingRole: "unit", materialType: "INDIVIDUAL", displayName: "Bolsa", displayNameEn: "Bag", unitCost: 0.12, isActive: true,
        lowVolumeMaximumQuantity: 6000, mediumVolumeMinimumQuantity: 25000, mediumVolumeUnitCost: 0, highVolumeMinimumQuantity: 50000, highVolumeUnitCost: 0.08 }
    let resetValues, sent
    const values = { classification: "generic", packagingRole: "unit", unitCost: 0.12 }
    const h = harness("es", {
        react: { ...React, useEffect: effect => effect() },
        "react-hook-form": { useForm: () => ({ register: name => ({ name }), watch: name => values[name], reset: value => { resetValues=value }, formState: { errors: {} }, handleSubmit: handler => () => handler(values) }) },
        "@tanstack/react-query": { useQuery: () => ({ data: {data: material} }), useQueryClient: () => ({ invalidateQueries() {} }), useMutation: options => ({ mutate: value => options.mutationFn(value) }) },
        "react-router-dom": { Link:"Link", useNavigate: () => () => {}, useParams: () => ({packagingId:"1"}) },
        "@/feature/packaging/api/packaging.api": { getPackagingByIdAPI() {}, updatePackagingAPI: async (id, value) => { sent={id,value} } },
        "@/feature/packaging/component/packagingForm.component": { PackagingForm:"PackagingForm" },
        "@/shared/component/pageContainer.component": { PageContainer:"PageContainer" },
        "@/shared/component/card.component": { Card:"Card" },
        "@/shared/component/button.component": { Button:"Button" },
    })
    const { EditPackagingPage } = h.load("src/feature/packaging/page/editPackaging.page.tsx")
    const tree = EditPackagingPage()
    assert.equal(resetValues.mediumVolumeMaximumQuantity,25000)
    assert.equal(resetValues.lowVolumeMaximumQuantity,6000)
    assert.equal(resetValues.mediumVolumeUnitCost,0)
    assert.equal(resetValues.highVolumeUnitCost,0.08)
    await nodes(tree).find(node => node.type === "form").props.onSubmit()
    assert.deepEqual(JSON.parse(JSON.stringify(sent)),{id:1,value:{...values,lowVolumeMaximumQuantity:null,mediumVolumeMaximumQuantity:null,mediumVolumeMinimumQuantity:null,mediumVolumeUnitCost:null,highVolumeMinimumQuantity:null,highVolumeUnitCost:null,highVolumeMaximumQuantity:null,fourthVolumeMaximumQuantity:null,fourthVolumeUnitCost:null}})
})

test("administrative snapshots retain volume pricing while representative schemas and historical lines remain compatible", () => {
    const { quoteLineSchema, representativeQuoteLineSchema } = harness().load("src/feature/quote/schema/quote.schema.ts")
    const pricing = { tier:"medium",materialQuantity:25000,minimumQuantity:25000 }
    const unit = {packagingId:1,displayName:"Bag",optionGroup:null,unitCost:0.1,quantityPerUnit:1,totalUnits:25000,lineTotal:2500,volumePricing:pricing}
    const intermediate = { packagingId: 2, displayName: "Intermediate", optionGroup: null, unitCost: 0, lineTotal: 0, unitsPerPackage: 5, totalUnits: 25000, packagesNeeded: 5000,
        volumePricing: { tier: "base", priceTier: "base", materialQuantity: 5000, minimumQuantity: 0, maximumQuantity: 5000, minimumExclusive: true } }
    const pallet = { packagingId: 3, displayName: "Box label", optionGroup: null, unitCost: 0.1, lineTotal: 2500.1, quantityPerPallet: 2500.1, requestedPallets: 10,
        volumePricing: { tier: "fourth", priceTier: "high", materialQuantity: 25001, minimumQuantity: 15000, maximumQuantity: null, minimumExclusive: true, referenceMaximumQuantity: 20000 } }
    const line = {destinationId:null,productDisplayName:"Product",variantLabel:"SKU",requestedPallets:10,totalUnits:25000,
        rawMaterialCost:0,unitPackagingCost:2500,intermediatePackagingCost:0,palletMaterialCost:0,transportCost:0,totalCost:2500,
        breakdown:{rawMaterials:[],unitMaterials:[unit],intermediateMaterials:[intermediate],palletMaterials:[pallet],transport:{destinationId:null,displayName:"",baseCost:0}}}
    const before = JSON.stringify(line)
    const admin = quoteLineSchema.parse(line)
    const representative=representativeQuoteLineSchema.parse(line)
    const historical=structuredClone(line)
    for (const level of ["unitMaterials", "intermediateMaterials", "palletMaterials"]) {
        assert.deepEqual(JSON.parse(JSON.stringify(admin.breakdown[level][0].volumePricing)), line.breakdown[level][0].volumePricing)
        for (const field of ["volumePricing", "unitCost", "lineTotal"]) assert.equal(representative.breakdown[level][0][field], undefined)
        delete historical.breakdown[level][0].volumePricing
    }
    assert.equal(quoteLineSchema.safeParse(historical).success,true)
    assert.equal(JSON.stringify(line), before)
})

for (const language of ["es", "en"]) for (const [tier, priceTier] of [["high", "medium"], ["fourth", "high"]]) test(`administrative ${tier} breakdown explains price fallback and stays absent from representative views (${language})`, () => {
    const h = harness(language)
    const { quoteLineSchema, representativeQuoteLineSchema } = h.load("src/feature/quote/schema/quote.schema.ts")
    const { QuoteResultCard } = h.load("src/feature/quote/component/quoteResultCard.component.tsx")
    const render = result => require("react-dom/server").renderToStaticMarkup(React.createElement(QuoteResultCard, { result, isPending: false }))
    const line = { destinationId: null, productDisplayName: "Product", variantLabel: "SKU", requestedPallets: 1, totalUnits: 80000,
        rawMaterialCost: 0, unitPackagingCost: 9876, intermediatePackagingCost: 0, palletMaterialCost: 0, transportCost: 0, totalCost: 9876,
        breakdown: { rawMaterials: [], palletMaterials: [], transport: { destinationId: null, displayName: "", baseCost: 0 },
            unitMaterials: [{ packagingId: 1, displayName: "Etiqueta", displayNameEn: "Label", optionGroup: null, quantityPerUnit: 1, totalUnits: 80000, unitCost: 0.123456789012, lineTotal: 9876,
                volumePricing: { tier, priceTier, referenceMaximumQuantity: 20000, materialQuantity: 80000, minimumQuantity: 25000, maximumQuantity: null, minimumExclusive: true } }] } }
    const markup = render(quoteLineSchema.parse(line))
    assert.ok(markup.includes(resources[language].packaging.volumePricing[tier]))
    assert.ok(markup.includes("$0.123456789012"))
    assert.ok(markup.includes(resources[language].packaging.volumePricing.fallback.replace("{{costType}}", resources[language].packaging.volumePricing[priceTier + "Cost"])))
    const representative = render(representativeQuoteLineSchema.parse(line))
    assert.ok(representative.includes(resources[language].quote.pendingReview.title))
    assert.doesNotMatch(representative, /\$|0\.123456789012/)
    assert.ok(!representative.includes(resources[language].packaging.volumePricing[tier]))
    delete line.breakdown.unitMaterials[0].volumePricing
    const historical = render(quoteLineSchema.parse(line))
    assert.ok(!historical.includes(resources[language].packaging.volumePricing[tier]))
})

test("effective catalog limits prefer current values over legacy references and ignore the old high minimum", () => {
    const { getPackagingVolumeLimits } = harness().load("src/feature/packaging/schema/packagingVolumePricing.schema.ts")
    for (const [input, low, medium] of [[{}, 5000, 25000], [{ mediumVolumeMinimumQuantity: 30000, highVolumeMinimumQuantity: 80000 }, 5000, 30000],
        [{ lowVolumeMaximumQuantity: 6000, mediumVolumeMaximumQuantity: 35000, mediumVolumeMinimumQuantity: 30000 }, 6000, 35000]]) {
        const limits = getPackagingVolumeLimits(input)
        assert.equal(limits.low, low)
        assert.equal(limits.medium, medium)
    }
})

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

test("fourth tier validates ordered limits, zero costs and numeric response values", () => {
    const { createPackagingSchema, updatePackagingSchema, responsePackagingSchema } = harness().load("src/feature/packaging/schema/packaging.schema.ts")
    const base = { code: "FOUR", displayName: "Bag", displayNameEn: "Bag", classification: "specific", packagingRole: "unit", unitCost: 3,
        lowVolumeMaximumQuantity: 5000, mediumVolumeMaximumQuantity: 10000, highVolumeMaximumQuantity: 15000, fourthVolumeMaximumQuantity: 20000, fourthVolumeUnitCost: 0 }
    for (const schema of [createPackagingSchema, updatePackagingSchema]) {
        assert.equal(schema.parse(base).fourthVolumeUnitCost, 0)
        for (const invalid of [{ highVolumeMaximumQuantity: 10000 }, { fourthVolumeMaximumQuantity: 15000 }, { highVolumeMaximumQuantity: null }, { fourthVolumeUnitCost: -1 }]) {
            assert.equal(schema.safeParse({ ...base, ...invalid }).success, false)
        }
        assert.equal(schema.safeParse({ ...base, classification: "generic" }).success, false)
    }
    const response = { ...base, id: 1, materialType: "INDIVIDUAL", isActive: true, createdAt: "2026-11-12", updatedAt: "2026-11-12" }
    assert.equal(responsePackagingSchema.parse(response).fourthVolumeUnitCost, 0)
    assert.equal(responsePackagingSchema.safeParse({ ...response, fourthVolumeUnitCost: "0" }).success, false)
})

for (const language of ["es", "en"]) test("legacy edit keeps its open-ended third tier until an explicit limit is set (" + language + ")", () => {
    const h = harness(language)
    const { PackagingVolumePricingFields } = h.load("src/feature/packaging/component/packagingVolumePricingFields.component.tsx")
    const props = { register: name => ({ name }), watch: () => null, setValue() {}, errors: {}, preserveExisting: true }
    const tree = PackagingVolumePricingFields(props)
    const third = nodes(tree).find(node => node.props?.tier === "high")
    assert.equal(third.props.suggestedMaximum, null)
    const fourth = nodes(tree).find(node => node.type === "fieldset" && node.props.disabled)
    assert.ok(fourth)
    assert.ok(JSON.stringify(fourth).includes(resources[language].packaging.volumePricing.configurePrevious))
    const editor = quantityEditor(h, h.render(() => third.type(third.props)))
    assert.ok(JSON.stringify(editor).includes(resources[language].packaging.volumePricing.unbounded))
})
