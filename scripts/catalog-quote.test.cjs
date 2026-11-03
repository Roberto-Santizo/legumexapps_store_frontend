const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")

function loader(overrides = {}) {
    const cache = new Map()
    function load(file) {
        file = path.resolve(file)
        if (cache.has(file)) return cache.get(file).exports
        const module = { exports: {} }; cache.set(file, module)
        const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
        const localRequire = name => {
            // Los mocks parciales de react conservan el resto de la API real (p. ej. createContext al importar);
            // los componentes se llaman como funciones, sin renderizador: useContext = sin proveedor.
            if (name === "react" && name in overrides) return { ...require("react"), useContext: () => null, ...overrides.react }
            if (name in overrides) return overrides[name]
            if (name.startsWith("@/") || name.startsWith(".")) {
                const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(file), name)
                return load([`${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate)))
            }
            return require(name)
        }
        vm.runInThisContext(`(function(require,module,exports,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout){${source}\n})`, { filename: file })(localRequire,module,module.exports,overrides.frames?.request,overrides.frames?.cancel,overrides.timers?.set ?? setTimeout,overrides.timers?.clear ?? clearTimeout)
        return module.exports
    }
    return load
}
const statePath = "src/feature/customQuote/util/catalogQuoteState.ts"
test("representative fixed catalog is keyed by customer and is unavailable before selection or for prospects", async () => {
    const queries = [], requests = []
    let shared = { id: "order-a", selected: false, clientId: null, clientName: "", lines: [], identity: { id: "order-a", clientName: "", clientId: null }, isCurrentOrder: () => true }
    const nodes = tree => !tree || typeof tree !== "object" ? [] : [tree, ...[].concat(tree.props?.children ?? []).flat(Infinity).flatMap(nodes)]
    const overrides = {
        react: { useState: initial => [typeof initial === "function" ? initial() : initial, () => {}], useCallback: callback => callback },
        "react-i18next": { useTranslation: () => ({ t: key => key, i18n: { language: "es" } }) },
        "react-router-dom": { Link: "Link" },
        "@tanstack/react-query": { useQuery: options => { queries.push(options); return { data: { data: [] }, isLoading: false, isError: false } }, useMutation: options => ({ ...options, mutate: () => {}, isPending: false }) },
        sonner: { toast: { error() {}, success() {} } },
        "@/shared/auth/salesperson/useSalespersonAuth": { useSalespersonAuth: () => ({ salesperson: { id: 42, name: "Representative" }, logout() {} }) },
        "@/shared/component/siteContainer.component": { SiteContainer: "Container" },
        "@/feature/quote/api/quote.api": { getQuoteProductsAPI: id => { requests.push(id) }, previewQuoteAPI() {}, saveQuoteAPI() {} },
        "../hook/useSharedQuoteOrder": { useSharedQuoteOrder: () => shared },
        "../component/quoteOrderClient.component": { QuoteOrderClient: "Client" },
        "@/feature/quote/hook/useQuoteOrder": { useQuoteOrder: () => ({ quotedLines: [], formResetKey: 0, handleQuoteAnother() {} }) },
    }
    for (const [file, name] of [["quoteCalculatorForm", "QuoteCalculatorForm"], ["quoteWizardContent", "QuoteWizardContent"], ["quoteResultCard", "QuoteResultCard"], ["quotedOrderSummary", "QuotedOrderSummary"], ["quotePdfButton", "QuotePdfButton"], ["representativeOrderSummary", "RepresentativeOrderSummary"]]) overrides[`@/feature/quote/component/${file}.component`] = { [name]: name }
    const Page = loader(overrides)("src/feature/quote/page/quoteRequest.page.tsx").QuoteRequestPage
    assert.ok(!nodes(Page()).some(node => node.type === "QuoteWizardContent")); assert.equal(queries.at(-1).enabled, false)
    for (const clientId of [11, 12]) {
        shared = { ...shared, selected: true, clientId, clientName: "Assigned", identity: { ...shared.identity, clientId, clientName: "Assigned" } }
        assert.ok(nodes(Page()).some(node => node.type === "QuoteWizardContent"))
        assert.deepEqual(queries.at(-1).queryKey, ["quoteProducts", 42, clientId, "es"])
        assert.equal(queries.at(-1).enabled, true); await queries.at(-1).queryFn()
    }
    assert.deepEqual(requests, [11, 12])
    shared = { ...shared, clientId: null, clientName: "Prospect", identity: { ...shared.identity, clientId: null, clientName: "Prospect" } }
    const prospect = nodes(Page())
    assert.ok(!prospect.some(node => node.type === "QuoteWizardContent")); assert.equal(queries.at(-1).enabled, false)
    assert.ok(prospect.some(node => node.type === "Link" && node.props.to === "/solicitud/a-la-medida"))
})
test("customer selector offers only assigned customers and confirms before discarding an order", () => {
    const selected = [], changes = [], resets = []
    const nodes = tree => !tree || typeof tree !== "object" ? [] : [tree, ...[].concat(tree.props?.children ?? []).flat(Infinity).flatMap(nodes)]
    const Component = loader({
        react: { useState: () => [true, () => {}] },
        "react-i18next": { useTranslation: () => ({ t: key => key }) },
        "@tanstack/react-query": { useQuery: () => ({ data: { data: [{ id: 11, name: "Walmart" }, { id: 12, name: "HEB", email: "compras@heb.com" }] }, isLoading: false, isError: false }) },
        "@/shared/auth/salesperson/useSalespersonAuth": { useSalespersonAuth: () => ({ salesperson: { id: 42 } }) },
        "@/shared/component/searchableSelect.component": { SearchableSelect: "Select" },
        "@/shared/component/input.component": { Input: "Input" },
        "@/shared/component/formField.component": { FormField: "Field" },
        "../api/quote.api": { getQuoteClientsAPI: () => {} },
    })("src/feature/quote/component/quoteOrderClient.component.tsx").QuoteOrderClient
    const props = { name: "Walmart", clientId: 11, email: "", selected: true, hasLines: true, onEmailChange: () => {}, onSelect: (...args) => selected.push(args), onChange: name => changes.push(name), onReset: () => resets.push(true) }
    const previousWindow = globalThis.window
    try {
        const select = nodes(Component(props)).find(node => node.type === "Select")
        assert.deepEqual(select.props.options.map(option => option.value), [11, 12, 0])
        assert.equal(select.props.isSearchable, undefined) // react-select searches by default.
        globalThis.window = { confirm: () => false }
        select.props.onChange({ value: 12, label: "HEB" })
        assert.equal(selected.length, 0); assert.equal(resets.length, 0)
        globalThis.window.confirm = () => true
        select.props.onChange({ value: 12, label: "HEB" })
        select.props.onChange({ value: 0, label: "New" })
        // El correo registrado del cliente precarga el del pedido; un prospecto empieza sin correo.
        assert.deepEqual(selected, [[12, "HEB", "compras@heb.com"], [null, "", ""]]); assert.equal(resets.length, 2)
        assert.ok(!nodes(Component(props)).some(node => node.type === "Input"))
        const input = nodes(Component({ ...props, clientId: null, name: "", hasLines: false })).find(node => node.type === "Input")
        input.props.onChange({ target: { value: "New prospect" } }); assert.deepEqual(changes, ["New prospect"])
    } finally { globalThis.window = previousWindow }
})

test("customer form collapses after selection or completing a prospect name and can be reopened", () => {
    let editing = false
    const nodes = tree => !tree || typeof tree !== "object" ? [] : [tree, ...[].concat(tree.props?.children ?? []).flat(Infinity).flatMap(nodes)]
    const Component = loader({
        react: { useState: () => [editing, value => { editing = value }] },
        "react-i18next": { useTranslation: () => ({ t: key => key }) },
        "@tanstack/react-query": { useQuery: () => ({ data: { data: [{ id: 11, name: "Walmart" }] } }) },
        "@/shared/auth/salesperson/useSalespersonAuth": { useSalespersonAuth: () => ({ salesperson: { id: 42 } }) },
        "@/shared/component/searchableSelect.component": { SearchableSelect: "Select" },
        "@/shared/component/input.component": { Input: "Input" },
        "@/shared/component/formField.component": { FormField: "Field" },
        "../api/quote.api": { getQuoteClientsAPI() {} },
    })("src/feature/quote/component/quoteOrderClient.component.tsx").QuoteOrderClient
    let props = { name: "", clientId: null, selected: false, hasLines: false, onSelect: (clientId, name) => { props = { ...props, clientId, name, selected: true } }, onChange: name => { props = { ...props, name } }, onReset() {} }
    const render = () => nodes(Component(props))
    assert.ok(render().some(node => node.type === "Select"))
    render().find(node => node.type === "Select").props.onChange({ value: 11, label: "Walmart" })
    assert.ok(!render().some(node => node.type === "Select" || node.type === "Field"))
    // The collapsed summary shows who the order is for; only prospects get the "new customer" badge.
    assert.ok(render().some(node => node.props?.children === "Walmart"))
    assert.ok(!render().some(node => node.props?.children === "quote.clientSelection.prospectBadge"))
    render().find(node => node.type === "button").props.onClick()
    assert.ok(render().some(node => node.type === "Select"))
    render().find(node => node.type === "Select").props.onChange({ value: 0, label: "New" })
    const input = render().find(node => node.type === "Input")
    input.props.onBlur({ target: { value: " " } }); assert.ok(render().some(node => node.type === "Input"))
    input.props.onChange({ target: { value: "Prospect" } })
    input.props.onBlur({ target: { value: "Prospect" } })
    assert.ok(!render().some(node => node.type === "Input" || node.type === "Select"))
    assert.ok(render().some(node => node.props?.children === "quote.clientSelection.prospectBadge"))
    render().find(node => node.type === "button").props.onClick()
    let prevented = false
    render().find(node => node.type === "Input").props.onKeyDown({ key: "Enter", currentTarget: { value: "Prospect" }, preventDefault: () => { prevented = true } })
    assert.equal(prevented, true); assert.ok(!render().some(node => node.type === "Input"))
    assert.equal(props.name, "Prospect")
})

test("changing customer clears all lines and rejects late calculations from the previous order", () => {
    const previousStorage = globalThis.sessionStorage
    const storage = new Map(); const slots = []; let cursor = 0
    globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
    const react = {
        useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial; return [slots[i], value => { slots[i] = value }] },
        useRef: initial => { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i] },
    }
    const hook = loader({ react, "@/shared/auth/salesperson/useSalespersonAuth": { useSalespersonAuth: () => ({ salesperson: { id: 42 } }) } })("src/feature/quote/hook/useSharedQuoteOrder.ts").useSharedQuoteOrder
    const render = () => { cursor = 0; return hook() }
    try {
        let order = render(); assert.equal(order.selected, false)
        order.selectClient(11, "Walmart"); order = render()
        const oldIdentity = order.identity, lateAdd = order.addLine
        const line = { breakdown: { order: oldIdentity }, totalCost: 12 }
        order.addLine(line); assert.equal(render().lines.length, 1)
        order.selectClient(12, "HEB"); order = render()
        assert.equal(order.lines.length, 0); assert.notEqual(order.id, oldIdentity.id)
        lateAdd(line); assert.equal(render().lines.length, 0)
        order.selectClient(null, ""); order = render(); order.setClientName("Prospect")
        assert.equal(render().identity.clientName, "Prospect"); assert.equal(render().clientId, null)
    } finally { globalThis.sessionStorage = previousStorage }
})
test("shared order survives navigation and refresh, preserves custom composition, locks customer and isolates representatives", () => {
    const previousStorage = globalThis.sessionStorage
    const storage = new Map()
    globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
    let current, salespersonId = 42
    const react = { useRef: value => ({ current: value }), useState: initial => { if (!current) current = typeof initial === "function" ? initial() : initial; return [current, value => { current = value }] } }
    const useOrder = loader({ react, "@/shared/auth/salesperson/useSalespersonAuth": { useSalespersonAuth: () => ({ salesperson: { id: salespersonId } }) } })("src/feature/quote/hook/useSharedQuoteOrder.ts").useSharedQuoteOrder
    try {
        let order = useOrder(); order.selectClient(11, "Customer A"); order = useOrder()
        const line = { destinationId: null, productDisplayName: "Fixed product", variantLabel: "500g", requestedPallets: 1, totalUnits: 20, rawMaterialCost: 10, unitPackagingCost: 1, intermediatePackagingCost: 0, palletMaterialCost: 1, transportCost: 0, totalCost: 12, breakdown: { order: order.identity, rawMaterials: [], palletMaterials: [], transport: { destinationId: null, displayName: "", baseCost: 0 } } }
        order.addLine(line); order = useOrder(); order.setClientName("Wrong customer"); assert.equal(useOrder().clientName, "Customer A")
        current = undefined // route navigation/refresh mounts another hook instance
        order = useOrder(); assert.equal(order.lines.length, 1)
        const custom = { ...line, productDisplayName: "Custom mix", composition: { rawMaterials: [{ displayName: "Pineapple", percentage: 100 }], ingredients: [] } }
        order.addLine(custom); current = undefined; order = useOrder()
        assert.equal(order.lines.length, 2); assert.equal(order.lines[1].composition.rawMaterials[0].percentage, 100)
        const sameOrderId = order.id
        salespersonId = 99; current = undefined; assert.equal(useOrder().lines.length, 0)
        salespersonId = 42; current = undefined; order = useOrder(); assert.equal(order.id, sameOrderId)
        order.clear(); current = undefined; order = useOrder(); assert.equal(order.lines.length, 0); assert.equal(order.clientName, ""); assert.notEqual(order.id, sameOrderId)
    } finally { globalThis.sessionStorage = previousStorage }
})
test("catalog page sends confirmed document lines to existing PDF/email actions without another confirmation",()=>{
    let slots=[],cursor=0
    const react={useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],value=>{slots[i]=typeof value==="function"?value(slots[i]):value}]}}
    const order={id:"order",selected:true,clientId:11,lines:[],clientName:"Customer",identity:{id:"order",clientName:"Customer",clientId:11},addLine:line=>order.lines.push(line),clear:()=>{order.lines=[]},setClientName:()=>{}}
    const Page=loader({react,"react-router-dom":{Link:"Link"},"react-i18next":{useTranslation:()=>({t:key=>key})},"@/feature/quote/hook/useSharedQuoteOrder":{useSharedQuoteOrder:()=>order},"@/feature/quote/component/quoteOrderClient.component":{QuoteOrderClient:"Client"},"../component/catalogQuoteWizard.component":{CatalogQuoteWizard:"Wizard"},"@/feature/quote/component/representativeOrderSummary.component":{RepresentativeOrderSummary:"Summary"},"@/shared/component/siteContainer.component":{SiteContainer:"Container"}})("src/feature/customQuote/page/catalogQuoteRequest.page.tsx").CatalogQuoteRequestPage
    const nodes=tree=>!tree||typeof tree!=="object"?[]:[tree,...[].concat(tree.props?.children??[]).flat(Infinity).flatMap(nodes)]
    const render=()=>{cursor=0;return nodes(Page())}
    const persisted={id:5,totalUnits:10,requestedPallets:1,breakdown:{production:{kind:"customizable"},rawMaterials:[],palletMaterials:[]},composition:{rawMaterials:[{displayName:"Mango",percentage:100}]},configuration:{snapshot:{isOrganic:true}}}
    render().find(row=>row.type==="Wizard").props.onConfirmed(persisted)
    const summary=render().find(row=>row.type==="Summary")
    assert.equal(summary.props.lines[0],persisted)
    assert.equal(summary.props.orderId,"order")
    assert.equal(summary.props.clientName,"Customer")

    // The representative summary hands the same lines to the PDF action (download only: the representative
    // never emails a quote), without amounts until management approves and authorizes sending; then with
    // the final price from the server and no more products. A rejected order takes no more products either.
    let review=null
    const Summary=loader({react:{useMemo:factory=>factory()},"@/feature/quote/hook/useQuoteOrderReview":{useQuoteOrderReview:(orderId,enabled)=>({review,isLoading:false,isError:false,isRefreshing:false,isSubmitting:false,submit(){},refresh(){},orderId,enabled})},"@/feature/quote/component/quotedOrderSummary.component":{QuotedOrderSummary:"OrderSummary"},"@/feature/quote/component/quotePdfButton.component":{QuotePdfButton:"Pdf"},"@/feature/quote/component/quoteOrderReviewPanel.component":{QuoteOrderReviewPanel:"Review"}})("src/feature/quote/component/representativeOrderSummary.component.tsx").RepresentativeOrderSummary
    const quoteAnother=()=>{}
    const pending=Summary({orderId:"order",clientName:"Customer",lines:[persisted],onQuoteAnother:quoteAnother,onClear(){}})
    assert.equal(pending.props.lines[0],persisted)
    assert.equal(pending.props.onQuoteAnother,quoteAnother)
    assert.equal(pending.props.showCostBreakdown,false)
    assert.equal(pending.props.reviewPanel.type,"Review")
    assert.equal(pending.props.pdfAction.props.lines[0],persisted)
    assert.equal(pending.props.pdfAction.props.sendEmailAPI,undefined)
    assert.equal(pending.props.pdfAction.props.showCostBreakdown,false)
    assert.equal(pending.props.pdfAction.props.orderClientName,"Customer")
    // Approved without sending: the server sends no prices, so the lines stay without them.
    review={orderId:"order",status:"approved",submittedAt:new Date(),reviewedAt:new Date(),deliveryStatus:"pending",deliveryRecipients:null}
    const approvedNotSent=Summary({orderId:"order",clientName:"Customer",lines:[persisted],onQuoteAnother:quoteAnother,onClear(){}})
    assert.equal(approvedNotSent.props.lines[0].finalPrice,undefined)
    assert.equal(approvedNotSent.props.onQuoteAnother,undefined)
    review={orderId:"order",status:"rejected",submittedAt:new Date(),reviewedAt:new Date(),deliveryStatus:"pending",deliveryRecipients:null,rejectionReason:"Sin producto"}
    assert.equal(Summary({orderId:"order",clientName:"Customer",lines:[persisted],onQuoteAnother:quoteAnother,onClear(){}}).props.onQuoteAnother,undefined)
    review={orderId:"order",status:"approved",submittedAt:new Date(),reviewedAt:new Date(),deliveryStatus:"sent",deliveryRecipients:"representative",finalPrice:25,lines:[{kind:"fixed",quoteId:5,finalPrice:99},{kind:"customizable",quoteId:5,finalPrice:25}]}
    const approved=Summary({orderId:"order",clientName:"Customer",lines:[persisted],onQuoteAnother:quoteAnother,onClear(){}})
    assert.equal(approved.props.lines[0].finalPrice,25)
    assert.equal(approved.props.pdfAction.props.lines[0].finalPrice,25)
    assert.equal(approved.props.onQuoteAnother,undefined)
    assert.equal(persisted.finalPrice,undefined)
})
test("exact percentage UI accepts 100.00 and rejects tolerance, invalid precision and negative values", () => {
    const { exactMix } = loader()(statePath)
    for (const values of [{ 1:"100.00" },{ 1:"33.33",2:"33.33",3:"33.34" },{1:"50",2:"50"}]) assert.equal(exactMix(values),true)
    for (const values of [{1:"99.99"},{1:"100.01"},{1:"100.001"},{1:"-1",2:"101"},{1:"abc"},{}]) assert.equal(exactMix(values),false)
})
test("dependency resets remove composition/configuration/packaging at the correct boundary", () => {
    const { changeCatalogSelection: change, emptyCatalogSelection } = loader()(statePath)
    const state = { ...emptyCatalogSelection(),categoryId:1,subCategoryId:2,ingredientType:"fruit",percentages:{1:"100"},configurationId:3,choices:{"unit:a":4} }
    const category = change(state,"categoryId",9); assert.equal(category.subCategoryId,null); assert.deepEqual(category.percentages,{})
    const sub = change(state,"subCategoryId",9); assert.equal(sub.categoryId,1); assert.equal(sub.configurationId,null)
    const type=change(state,"ingredientType","pulp"); assert.deepEqual(type.percentages,{}); assert.equal(type.configurationId,3); assert.deepEqual(type.choices,state.choices)
    assert.equal("isOrganic" in emptyCatalogSelection(),false)
    const config=change(state,"configurationId",9); assert.deepEqual(config.percentages,state.percentages); assert.deepEqual(config.choices,state.choices)
})
test("packaging chooser permits configured options only and never invents a default", () => {
    const { catalogMaterialGroups } = loader()(statePath)
    const option = id => ({id,packagingId:id+100,displayName:"Bag",isDefault:false})
    const config = { packaging:{unit:{groups:[{key:"id:1",packagingGroupId:7,group:"Bag",selectionMode:"one",isRequired:true,options:[option(1),option(2)]}]},intermediate:{groups:[]},pallet:{groups:[]}} }
    assert.equal(catalogMaterialGroups(config,{"unit:catalog:7":102})[0].selectedId,2)
    assert.equal(catalogMaterialGroups(config,{"unit:catalog:7":999})[0].selectedId,undefined)
    assert.equal(catalogMaterialGroups(config,{})[0].selectedId,undefined)
    config.packaging.unit.groups[0].options.pop()
    assert.equal(catalogMaterialGroups(config,{})[0].selectedId,1)
})
test("legacy and new document mapping preserve frozen composition and certification without source data", () => {
    const { toCustomQuoteDocumentLine } = loader()("src/feature/customQuote/util/customQuoteComposition.ts")
    const legacy = { configuration:{rawMaterialMix:[{rawMaterialId:1,percentage:100}]},breakdown:{rawMaterials:[{rawMaterialId:1,displayName:"Frozen fruit"}],ingredients:[]} }
    assert.equal(toCustomQuoteDocumentLine(legacy).composition.rawMaterials[0].displayName,"Frozen fruit")
    assert.equal(toCustomQuoteDocumentLine(legacy).composition.context,undefined)
    const modern = {...legacy,configuration:{...legacy.configuration,snapshot:{category:{displayName:"Frozen"},subCategory:{displayName:"Fruits"},isOrganic:true,ingredientType:"fruit"}}}
    assert.equal(toCustomQuoteDocumentLine(modern).composition.context.isOrganic,true)
})
test("catalog APIs reject loading/confirm errors and use dedicated compatible endpoints", async () => {
    const calls=[]; const api={ get:async url=>{calls.push(url);throw new Error("offline")},post:async url=>{calls.push(url);throw new Error("conflict")} }
    const load=loader({"@/shared/api/salespersonApi":{__esModule:true,default:api}})
    const methods=load("src/feature/customQuote/api/catalogQuote.api.ts")
    await assert.rejects(methods.discoverCatalogAPI(),/offline/)
    await assert.rejects(methods.previewCatalogAPI({}),/conflict/)
    await assert.rejects(methods.confirmCatalogAPI({}),/conflict/)
    assert.deepEqual(calls,["/custom-quotes/configurations","/custom-quotes/catalog-preview","/custom-quotes/catalog-confirm"])
})
test("admin navigation retires legacy configuration while preserving Customize, history and juice configuration", () => {
    const { NAV_GROUPS } = loader()("src/shared/layout/adminNavigation.ts")
    const items = NAV_GROUPS.flatMap(group => group.items)
    assert.equal(items.some(item => item.url === "/admin/custom-quote-config"), false)
    assert.equal(items.some(item => item.permission === "customQuoteConfig:edit"), false)
    for (const url of ["/admin/quotes", "/admin/quotes/calculator"]) assert.ok(items.some(item => item.url === url))
    assert.ok(!items.some(item => item.url === "/admin/juice-config"))
    const routes = fs.readFileSync("src/shared/router/AdminRoutes.tsx", "utf8")
    assert.ok(!routes.includes('path: "custom-quote-config"'))
    assert.ok(routes.includes('path: "custom-quotes/:customQuoteId"'))
    for (const language of ["es", "en"]) {
        const translations = JSON.parse(fs.readFileSync(`src/shared/i18n/locales/${language}/translation.json`, "utf8"))
        assert.equal(translations.customQuoteConfig, undefined)
        assert.equal(typeof translations.customQuote, "object")
    }
})
test("Ready-made input remains unchanged; strict Customize rejects authored prices", () => {
    const load=loader(); const ordinary=load("src/feature/quote/schema/quote.schema.ts").calculateQuoteSchema
    const value={productVariantId:3,requestedPallets:2,selectedUnitMaterialIds:[1]}
    assert.deepEqual(JSON.parse(JSON.stringify(ordinary.parse(value))),value)
    const schema=load("src/feature/customQuote/schema/catalogQuote.schema.ts").catalogInputSchema
    const input={categoryId:1,subCategoryId:2,configurationId:3,ingredientType:"fruit",requestedPallets:1,rawMaterialMix:[{rawMaterialId:1,percentage:100}]}
    assert.equal(schema.safeParse(input).success,true); assert.equal(schema.safeParse({...input,totalCost:1}).success,false); assert.equal(schema.safeParse({...input,isOrganic:true}).success,false)
})

test("representative responses parse without amounts and drop any that slip through; admin lines still require them", () => {
    const load=loader(); const quote=load("src/feature/quote/schema/quote.schema.ts"); const custom=load("src/feature/customQuote/schema/catalogQuote.schema.ts")
    const breakdown={production:{productId:5,skuCode:"PIN-1",boxesPerPallet:10,bagsPerBox:10,netWeightGrams:453.59237},rawMaterials:[{rawMaterialId:1,displayName:"Piña",percentage:100,quantityPerUnit:1,totalUnits:200}],ingredients:[],unitMaterials:[{packagingId:20,displayName:"Bolsa",optionGroup:null,quantityPerUnit:1,totalUnits:200}],intermediateMaterials:[],palletMaterials:[{packagingId:40,displayName:"Caja",optionGroup:null,quantityPerPallet:10,requestedPallets:2}],language:"es"}
    const line={productVariantId:10,destinationId:null,productDisplayName:"Piña",variantLabel:"PIN-1",requestedPallets:2,totalUnits:200,boxesPerPallet:10,breakdown}
    const amountKeys=value=>!value||typeof value!=="object"?[]:Object.entries(value).flatMap(([key,child])=>[...(/cost|lineTotal|baseAmount/i.test(key)?[key]:[]),...amountKeys(child)])
    const saved=quote.savedRepresentativeQuoteSchema.parse({...line,id:9,createdAt:"2026-10-28T12:00:00Z"})
    assert.equal(saved.id,9); assert.deepEqual(saved.breakdown.rawMaterials,breakdown.rawMaterials)
    const leaked={...line,totalCost:507.4,rawMaterialCost:100,breakdown:{...breakdown,rawMaterials:[{...breakdown.rawMaterials[0],unitCost:0.5,lineTotal:100}],transport:{destinationId:null,displayName:"",baseCost:0}}}
    assert.deepEqual(amountKeys(quote.representativeQuoteCalculationSchema.parse(leaked)),[])
    assert.equal(quote.quoteCalculationSchema.safeParse(line).success,false)
    const configuration={subCategoryId:2,presentationId:3,requestedPallets:2,destinationId:null,rawMaterialMix:[{rawMaterialId:1,percentage:100}],ingredients:[],pallet:{boxesPerPallet:10,bagsPerBox:10,unitsPerIntermediatePackage:null},packaging:{unit:[],intermediate:[],pallet:[]}}
    const catalogLine={...line,subCategoryId:2,presentationId:3,bagsPerBox:10,unitsPerIntermediatePackage:null,configuration}
    assert.equal(custom.catalogPreviewSchema.safeParse({...catalogLine,previewToken:"token"}).success,true)
    assert.deepEqual(amountKeys(custom.catalogConfirmedSchema.parse({...catalogLine,totalCost:1,id:4,status:"new",createdAt:"2026-10-28T12:00:00Z"})),[])
})

function wizardHarness(previewAPI, confirmAPI, mode = "customer", order) {
    let slots=[],cursor=0,confirmed=[],effects=[]
    const timers=new Map();let timerId=0
    const react={__esModule:true,useState:initial=>{ const index=cursor++; if(!(index in slots)) slots[index]=typeof initial==="function"?initial():initial; return [slots[index],value=>{slots[index]=typeof value==="function"?value(slots[index]):value}] },useRef:initial=>{const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index]},useEffect:(effect,deps)=>{const index=cursor++;const prior=slots[index];if(!prior||deps.some((value,i)=>value!==prior.deps[i])){prior?.cleanup?.();slots[index]={deps};effects.push(()=>{slots[index].cleanup=effect()})}}}
    const config={id:5,fingerprint:"hash",presentationId:7,displayLabel:"500 g",netWeightGrams:500,bagsPerBox:6,boxesPerPallet:40,unitsPerIntermediatePackage:null,packaging:{unit:{fixed:[],groups:[]},intermediate:{fixed:[],groups:[]},pallet:{fixed:[],groups:[]}}}
    const query={data:{categories:[{id:1,displayName:"Frozen",subCategories:[{id:3,displayName:"Fruit",availability:"ready",compositionMode:"single",rawMaterials:[{rawMaterialId:1,displayName:"Mango",ingredientType:"fruit"}],configurations:[config]}]}]},refetch:async()=>{}}
    const overrides={react,"@tanstack/react-query":{useQuery:()=>query},"react-i18next":{useTranslation:()=>({t:key=>key,i18n:{language:"en"}})},"../api/catalogQuote.api":{discoverCatalogAPI:async()=>query.data,previewCatalogAPI:previewAPI,confirmCatalogAPI:confirmAPI ?? (async()=>({id:88,configuration:{rawMaterialMix:[{rawMaterialId:1,percentage:100}]},breakdown:{rawMaterials:[{rawMaterialId:1,displayName:"Mango"}],ingredients:[]}}))}}
    overrides["../api/adminCatalogQuote.api"] = { discoverAdminCatalogAPI: async () => query.data, previewAdminCatalogAPI: mode === "admin" ? previewAPI : async () => { throw new Error("Customer must not use admin calculation") } }
    if (mode === "admin") overrides["../api/catalogQuote.api"].previewCatalogAPI = async () => { throw new Error("Admin must not use customer preview") }
    overrides["@/feature/quote/component/quoteResultCard.component"] = { QuoteResultCard: "CostBreakdown" }
    for (const [name,exports] of [["optionCards","OptionCards"],["input","Input"],["button","Button"],["card","Card"],["spinner","Spinner"]]) overrides[`@/shared/component/${name}.component`]={[exports]:exports}
    overrides["@/feature/quote/component/quoteWizardBackButton.component"]={QuoteWizardBackButton:"Back"}
    overrides["@/shared/component/catalogQuoteUi.component"]={CatalogQuoteContext:"Context",CatalogQuoteStepper:"Stepper",CatalogQuoteSelectionCards:"OptionCards",CatalogQuoteNavigation:"Navigation",CatalogQuoteSection:"Section"}
    overrides["./catalogQuoteMixBuilder.component"]={CatalogQuoteMixBuilder:"MixBuilder"}
    overrides.timers={set:(callback)=>{timers.set(++timerId,callback);return timerId},clear:id=>timers.delete(id)}
    const component=loader(overrides)("src/feature/customQuote/component/catalogQuoteWizard.component.tsx").CatalogQuoteWizard
    function render(){cursor=0;const tree=component(mode === "admin" ? {mode} : {order,onConfirmed:line=>confirmed.push(line)});const pending=effects;effects=[];pending.forEach(effect=>effect());return tree}
    function all(tree){if(!tree||typeof tree!=="object")return [];if(typeof tree.type==="function")return all(tree.type(tree.props));return [tree,...[].concat(tree.props?.children??[]).flat(Infinity).flatMap(all)]}
    function node(type,predicate=()=>true){return all(render()).find(row=>row.type===type&&predicate(row.props))}
    const submitButton=()=>node("Button",p=>p.type==="submit")
    const submit=()=>node("form").props.onSubmit({preventDefault(){}})
    // Category -> subcategory -> presentation (its own step, before the mix; a single one is preselected) -> mix.
    function goToMix(){node("OptionCards").props.onChange(1);node("OptionCards").props.onChange(3);node("Navigation").props.onNext()}
    function goToPackaging(){goToMix();node("MixBuilder").props.onChange(1,"100");node("Navigation").props.onNext();render()}
    function reenterPackaging(){node("Back").props.onClick();node("Navigation").props.onNext();render()}
    function flushTimers(){render();const pending=[...timers.values()];timers.clear();pending.forEach(callback=>callback())}
    return {node,render,goToMix,goToPackaging,reenterPackaging,flushTimers,submit,submitButton,confirmed,query,config,timers}
}
test("combined step preselects a single presentation and shows logistics like fixed products",()=>{
    const h=wizardHarness(async()=>({}));h.goToPackaging()
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.packaging")
    assert.ok(h.node("p",p=>p.children==="500 g"))
    assert.equal(h.node("OptionCards",p=>p.options?.some(o=>o.value===5)),undefined)
    assert.equal(h.submitButton().props.disabled,false)
})
test("several presentations are cards; changing presentation keeps compatible packaging and drops the rest",()=>{
    const h=wizardHarness(async()=>({}));const configs=h.query.data.categories[0].subCategories[0].configurations
    const option=(id,packagingId)=>({id,packagingId,displayName:`Bag ${packagingId}`,isDefault:false})
    const packaging=(ids)=>({unit:{fixed:[],groups:[{key:"id:1",groupId:1,packagingGroupId:70,group:"Bag",selectionMode:"one",isRequired:true,options:ids.map(([id,p])=>option(id,p))}]},intermediate:{fixed:[],groups:[]},pallet:{fixed:[],groups:[]}})
    configs[0].packaging=packaging([[10,100],[11,101]]);configs.push({...configs[0],id:6,fingerprint:"other",packaging:packaging([[20,100],[21,102]])})
    const presentationCards=()=>h.node("OptionCards",p=>p.options.some(o=>o.value===5))
    const backToPresentation=()=>{h.node("Back").props.onClick();h.node("Navigation").props.onBack()}
    const forwardToPackaging=()=>{h.node("Navigation").props.onNext();h.node("Navigation").props.onNext();h.render()}
    h.node("OptionCards").props.onChange(1);h.node("OptionCards").props.onChange(3)
    // Several presentations: the presentation step blocks Continue until one is chosen.
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.presentation")
    assert.equal(h.node("Navigation").props.disabled,true)
    presentationCards().props.onChange(5)
    assert.equal(h.node("Navigation").props.disabled,false)
    h.node("Navigation").props.onNext();h.node("MixBuilder").props.onChange(1,"100");h.node("Navigation").props.onNext();h.render()
    assert.equal(presentationCards(),undefined)
    assert.equal(h.submitButton().props.disabled,true)
    h.node("OptionCards",p=>p.options.some(o=>o.value===10)).props.onChange(10)
    assert.equal(h.submitButton().props.disabled,false)
    backToPresentation();presentationCards().props.onChange(6);forwardToPackaging()
    assert.equal(h.node("OptionCards",p=>p.options.some(o=>o.value===20)).props.value,20)
    h.node("OptionCards",p=>p.options.some(o=>o.value===21)).props.onChange(21)
    backToPresentation();presentationCards().props.onChange(5);forwardToPackaging()
    assert.equal(h.node("OptionCards",p=>p.options.some(o=>o.value===10)).props.value,undefined)
})
test("always-included materials are read-only and never sent; optional groups can be left out",async()=>{
    const calls=[];const h=wizardHarness(async input=>{calls.push(input);return previewFixture},async()=>{throw new Error("offline")})
    h.config.packaging.pallet={fixed:[{id:91,packagingId:901,displayName:"Stretch",isDefault:false},{id:92,packagingId:902,displayName:"Tarima",isDefault:false}],groups:[{key:"id:4",groupId:4,packagingGroupId:40,group:"Extras",selectionMode:"one",isRequired:false,options:[{id:41,packagingId:401,displayName:"Label",isDefault:false}]}]}
    h.goToPackaging()
    const included=h.node("ul",p=>p["aria-label"]==="site.quoteRequest.form.wizard.materials.included")
    assert.ok(included)
    const cards=h.node("OptionCards",p=>p.options.some(o=>o.value===41))
    assert.equal(cards.props.value,0); assert.equal(cards.props.options[0].text,"site.quoteRequest.form.wizard.materials.none")
    assert.equal(h.submitButton().props.disabled,false)
    h.submit();await settle()
    assert.deepEqual(calls[0].packagingSelections,[])
    h.reenterPackaging()
    h.node("OptionCards",p=>p.options.some(o=>o.value===41)).props.onChange(41)
    h.submit();await settle()
    assert.deepEqual(calls.at(-1).packagingSelections,[{groupId:4,optionIds:[41]}])
})
test("live total is debounced, discards obsolete responses and its token confirms only the identical selection",async()=>{
    const previews=[],confirms=[]
    const h=wizardHarness(input=>new Promise(resolve=>previews.push({input,resolve})),async args=>{confirms.push(args);return {...previewFixture,id:88}})
    h.goToPackaging()
    assert.equal(previews.length,0)
    h.flushTimers();assert.equal(previews.length,1)
    h.node("Input",p=>p.id==="catalog-pallets").props.onChange({target:{value:"2"}})
    h.flushTimers();assert.equal(previews.length,2);assert.equal(previews[1].input.requestedPallets,2)
    previews[1].resolve({...previewFixture,totalCost:24,previewToken:"current"});await settle()
    previews[0].resolve({...previewFixture,totalCost:12,previewToken:"obsolete"});await settle()
    assert.ok(h.node("p",p=>p.className?.includes("text-3xl")&&String(p.children).includes("24")))
    h.submit();await settle()
    assert.equal(previews.length,2)
    assert.equal(confirms[0].previewToken,"current");assert.equal(confirms[0].input.requestedPallets,2)
})
test("wizard ignores obsolete async preview after user navigates back",async()=>{
    let resolve;const harness=wizardHarness(()=>new Promise(done=>resolve=done));harness.goToPackaging()
    const work=harness.submit()
    harness.node("Back").props.onClick()
    resolve({totalCost:1});await Promise.resolve();await Promise.resolve()
    assert.equal(harness.node("h2").props.children,"catalogQuote.steps.single")
    assert.equal(harness.confirmed.length,0)
    void work
})
const previewFixture={productDisplayName:"MANGO",variantLabel:"6 x 500 g",bagsPerBox:6,requestedPallets:1,totalCost:12,totalWeightPounds:120,previewToken:"signed",totalUnits:240,configuration:{isOrganic:false,pallet:{boxesPerPallet:40},rawMaterialMix:[{rawMaterialId:1,percentage:100}]},breakdown:{rawMaterials:[{rawMaterialId:1,displayName:"Mango"}],unitMaterials:[],intermediateMaterials:[],palletMaterials:[]}}
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve()}

test("admin traverses the shared wizard, calculates selected packaging/pallets once and never confirms", async () => {
    const calls=[];let complete;const h=wizardHarness(input=>{calls.push(input);return new Promise(resolve=>complete=resolve)},()=>{throw new Error("Customer persistence must never run")},"admin")
    h.config.packaging.unit.groups=[{key:"id:1",groupId:1,packagingGroupId:10,group:"Bag",selectionMode:"one",isRequired:true,options:[{id:10,packagingId:100,displayName:"Default bag",isDefault:false},{id:11,packagingId:101,displayName:"Custom bag",isDefault:false}]}]
    h.goToPackaging()
    h.node("OptionCards",p=>p.options.some(row=>row.value===11)).props.onChange(11)
    h.node("Input",p=>p.id==="catalog-pallets").props.onChange({target:{value:"3"}})
    h.submit();h.submit();await settle()
    assert.equal(calls.length,1)
    assert.equal(calls[0].requestedPallets,3)
    assert.deepEqual(calls[0].packagingSelections,[{groupId:1,optionIds:[11]}])
    assert.deepEqual(calls[0].rawMaterialMix,[{rawMaterialId:1,percentage:100}])
    assert.equal(h.node("fieldset").props.disabled,true)
    complete({...previewFixture,requestedPallets:3,totalCost:789});await settle()
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.result")
    assert.equal(h.node("CostBreakdown").props.result.totalCost,789)
    assert.equal(h.confirmed.length,0)
    assert.ok(h.node("p",p=>p.children==="adminQuoteCalculator.calculatedHint"))
})

test("admin rejects incomplete composition and quantity, retains failed selections and discards obsolete calculations",async()=>{
    let calls=0,finish;const h=wizardHarness(async()=>{calls++;if(calls===1)throw new Error("offline");return new Promise(resolve=>finish=resolve)},()=>{throw new Error("No confirmation")},"admin")
    h.goToPackaging()
    h.node("Input",p=>p.id==="catalog-pallets").props.onChange({target:{value:"0"}})
    h.submit();await settle();assert.equal(calls,0)
    h.node("Input",p=>p.id==="catalog-pallets").props.onChange({target:{value:"2"}})
    h.submit();await settle()
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.packaging")
    assert.equal(h.node("Input",p=>p.id==="catalog-pallets").props.value,"2")
    assert.ok(h.node("p",p=>p.role==="alert"&&p.children==="catalogQuote.previewError"))
    h.submit();await settle()
    h.node("Back").props.onClick()
    finish({...previewFixture,totalCost:123});await settle()
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.single")
    assert.equal(h.node("CostBreakdown"),undefined)
    h.node("MixBuilder").props.onChange(1,undefined)
    assert.equal(h.node("Navigation").props.disabled,true)
    assert.equal(h.confirmed.length,0)
})

test("admin API uses staff transport and calculation routes only", async()=>{
    const calls=[],api={get:async path=>{calls.push(path);return {data:{data:{categories:[]}}}},post:async(path,input)=>{calls.push([path,input]);return {data:{data:previewFixture}}}}
    const methods=loader({"@/shared/api/api":{__esModule:true,default:api},"../schema/customQuote.schema":{customQuoteCalculationSchema:{parse:value=>value}}})("src/feature/customQuote/api/adminCatalogQuote.api.ts")
    assert.deepEqual(await methods.discoverAdminCatalogAPI(),{categories:[],palletKit:[]})
    assert.equal((await methods.previewAdminCatalogAPI({requestedPallets:3})).totalCost,12)
    assert.deepEqual(calls,["/admin/quotes/catalog-configurations",["/admin/quotes/catalog-preview",{requestedPallets:3}]])
})

test("calculator selector opens customizable admin and preserves fixed preview submission",async()=>{
    const React=require("react"),calls=[],mutations={},saves=[],emails=[];let params=new URLSearchParams(),slots=[],cursor=0,nextId=70
    const saveAdminQuoteAPI=async input=>{saves.push(input);return {message:"created",data:{id:nextId++}}}
    const sendAdminQuotePdfEmailAPI=async formData=>{emails.push(formData);return {message:"sent"}}
    const useState=initial=>{const index=cursor++;if(!(index in slots))slots[index]=typeof initial==="function"?initial():initial;return[slots[index],value=>{slots[index]=typeof value==="function"?value(slots[index]):value}]}
    const useRef=initial=>{const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index]}
    const setAdminOrderPricingAPI=async(_orderId,amount)=>({data:{profitPerPound:Number(amount),lines:[70,71].map(quoteId=>({kind:"fixed",quoteId,finalPrice:quoteId}))}})
    const order={wizardStep:"product",quotedLines:[],currentResult:null,formResetKey:0,clearCurrentResult:()=>calls.push("clear"),addQuotedLine:()=>{},handleClearOrder:()=>calls.push("clear-order")}
    const overrides={react:{...React,useState,useRef},"react-i18next":{useTranslation:()=>({t:key=>key})},"react-router-dom":{useSearchParams:()=>[params,next=>{params=next}]},"@tanstack/react-query":{useQuery:()=>({data:{data:[]}}),useQueryClient:()=>({invalidateQueries:({queryKey})=>calls.push(["invalidate",queryKey])}),useMutation:options=>{const key=typeof options.mutationFn==="string"?options.mutationFn:options.mutationFn.name==="saveLine"?"save":"pricing";mutations[key]=options;return {isPending:false,mutate:input=>calls.push([key,input])}}},sonner:{toast:{success:message=>calls.push(["toast",message])}},"@/feature/quote/api/adminQuote.api":{previewAdminQuoteAPI:"fixed-preview",saveAdminQuoteAPI,sendAdminQuotePdfEmailAPI,setAdminOrderPricingAPI},"@/feature/quote/hook/useQuoteOrder":{useQuoteOrder:()=>order},"@/shared/component/pageContainer.component":{PageContainer:"Container"},"@/shared/component/button.component":{Button:"Button"}}
    for(const [file,name] of [["quoteCalculatorForm","QuoteCalculatorForm"],["quoteWizardContent","QuoteWizardContent"],["quoteResultCard","QuoteResultCard"],["quotedOrderSummary","QuotedOrderSummary"],["quotePdfButton","QuotePdfButton"]])overrides[`@/feature/quote/component/${file}.component`]={ [name]:name }
    const Page=loader(overrides)("src/feature/quote/page/adminQuoteCalculator.page.tsx").AdminQuoteCalculatorPage
    const nodes=tree=>!tree||typeof tree!=="object"?[]:[tree,...[].concat(tree.props?.children??[]).flat(Infinity).flatMap(nodes)]
    const fixed=nodes(Page({customizableCalculator:"CustomAdmin"})).find(row=>row.type?.name==="FixedAdminQuoteCalculatorPage")
    assert.ok(fixed)
    const render=()=>{cursor=0;return nodes(fixed.type()).find(row=>row.type==="QuoteWizardContent")}
    const saveButton=()=>nodes(render().props.result).find(row=>row.type==="Button")
    render().props.form.props.onSubmit({productVariantId:10,requestedPallets:2})
    assert.deepEqual(calls,["clear",["fixed-preview",{productVariantId:10,requestedPallets:2}]])
    // Calcular no guarda: el botón "Guardar esta cotización" aparece en el último paso, con el resultado.
    assert.equal(saveButton(),undefined)
    const result={totalCost:12}
    mutations["fixed-preview"].onSuccess({data:result},{productVariantId:10,requestedPallets:2})
    order.currentResult=result
    assert.ok(saveButton().props.children.includes("adminQuoteCalculator.save"))
    saveButton().props.onClick()
    assert.deepEqual(calls.at(-1),["save",result])
    const response=await mutations.save.mutationFn(result)
    assert.deepEqual({...saves[0],orderId:undefined},{productVariantId:10,requestedPallets:2,orderId:undefined})
    assert.match(saves[0].orderId,/^[0-9a-f-]{36}$/)
    mutations.save.onSuccess(response)
    assert.equal(saveButton().props.disabled,true)
    assert.ok(saveButton().props.children.includes("adminQuoteCalculator.saved"))
    assert.deepEqual(calls.slice(-4),[["toast","created"],["invalidate",["adminQuotes"]],["invalidate",["productionOrders"]],["invalidate",["dashboardSummary"]]])
    // Sin la ganancia aplicada no hay PDF para el cliente: nunca saldría el costo como precio.
    const pending={totalCost:30}
    mutations["fixed-preview"].onSuccess({data:pending},{productVariantId:11,requestedPallets:1})
    order.quotedLines=[result,pending]
    assert.equal(render().props.orderSummary.props.pdfAction,undefined)
    // Aplicar la ganancia guarda la línea pendiente (la guardada no se repite) y habilita el PDF con precios finales.
    mutations.pricing.onSuccess(await mutations.pricing.mutationFn("0.5"))
    assert.equal(saves.length,2)
    // El PDF del admin lleva el mismo aviso de "cotización de referencia" que el del representante y pide el destinatario.
    const pdf=render().props.orderSummary.props.pdfAction
    assert.deepEqual(pdf.props.lines.map(line=>line.finalPrice),[70,71])
    assert.equal(pdf.type,"QuotePdfButton")
    assert.equal(pdf.props.showReferenceDisclaimer,true)
    assert.equal(pdf.props.askRecipientName,true)
    // Enviar no vuelve a guardar las líneas ya guardadas y registra el envío en ambas.
    const formData=new FormData()
    assert.deepEqual(await pdf.props.sendEmailAPI(formData),{message:"sent"})
    assert.equal(saves.length,2)
    assert.deepEqual({...saves[1],orderId:undefined},{productVariantId:11,requestedPallets:1,orderId:undefined})
    assert.equal(saves[1].orderId,saves[0].orderId)
    assert.equal(emails[0],formData)
    assert.equal(formData.get("quoteIds"),"[70,71]")
    // Vaciar el pedido empieza otro: las siguientes líneas guardadas llevan un orderId nuevo.
    render().props.orderSummary.props.onClear()
    const next={totalCost:13}
    mutations["fixed-preview"].onSuccess({data:next},{productVariantId:12,requestedPallets:1})
    render()
    // Dos acciones simultáneas sobre la misma línea comparten el guardado en curso: una sola cotización.
    const savesBefore=saves.length
    await Promise.all([mutations.save.mutationFn(next),mutations.save.mutationFn(next)])
    assert.equal(saves.length,savesBefore+1)
    assert.notEqual(saves.at(-1).orderId,saves[0].orderId)
    order.quotedLines=[]
    order.currentResult=null
    nodes(Page({customizableCalculator:"CustomAdmin"})).find(row=>row.type==="button"&&row.props.children==="adminQuote.types.customizable").props.onClick()
    assert.equal(params.get("type"),"customizable")
    assert.ok(nodes(Page({customizableCalculator:"CustomAdmin"})).find(row=>row.type==="CustomAdmin"))
    assert.equal(nodes(Page({customizableCalculator:"CustomAdmin"})).find(row=>row.type?.name==="FixedAdminQuoteCalculatorPage"),undefined)
})

test("invalid pallet quantities block submission without preview or confirmation",async()=>{
    let calls=0
    const h=wizardHarness(async()=>{calls++;return previewFixture},async()=>{calls++;return {...previewFixture,id:88}})
    h.goToPackaging()
    for(const value of ["0","1.5","100001",""]){
        h.node("Input",p=>p.id==="catalog-pallets").props.onChange({target:{value}})
        assert.equal(h.node("Input",p=>p.id==="catalog-pallets").props["aria-invalid"],true)
        assert.equal(h.submitButton().props.disabled,true)
        h.submit();h.flushTimers()
        await settle()
        assert.equal(calls,0)
    }
    h.node("Input",p=>p.id==="catalog-pallets").props.onChange({target:{value:"2"}})
    assert.equal(h.submitButton().props.disabled,false)
})

test("obsolete confirmation cannot persist or replace a newer pending request",async()=>{
    const confirmations=[]
    const h=wizardHarness(async()=>previewFixture,()=>new Promise(resolve=>confirmations.push(resolve)))
    h.goToPackaging()
    h.submit();await settle()
    h.reenterPackaging()
    h.submit();await settle()
    confirmations[0]({...previewFixture,id:87});await settle()
    assert.equal(h.confirmed.length,0)
    assert.equal(h.submitButton().props["aria-busy"],true)
    assert.equal(h.node("fieldset").props.disabled,true)
    confirmations[1]({...previewFixture,id:88});await settle()
    assert.equal(h.confirmed.length,1)
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.result")
})

test("obsolete conflict refresh cannot replace the new request preview or release its processing lock",async()=>{
    let previews=0,resolveRefresh,resolveConfirmation,confirms=0,refetches=0
    const h=wizardHarness(()=>{
        previews++
        if(previews===2)return new Promise(resolve=>resolveRefresh=resolve)
        return Promise.resolve({...previewFixture,previewToken:previews===1?"old":"new"})
    },args=>{
        confirms++
        if(confirms===1)return Promise.reject({isAxiosError:true,response:{status:409}})
        assert.equal(args.previewToken,"new")
        return new Promise(resolve=>resolveConfirmation=resolve)
    })
    h.query.refetch=async()=>{refetches++}
    h.goToPackaging();h.submit();await settle()
    assert.equal(refetches,1)
    h.reenterPackaging()
    h.submit();await settle()
    resolveRefresh({...previewFixture,previewToken:"obsolete",totalCost:999});await settle()
    assert.equal(h.confirmed.length,0)
    assert.equal(h.submitButton().props["aria-busy"],true)
    h.submit();await settle()
    assert.equal(confirms,2)
    resolveConfirmation({...previewFixture,id:88});await settle()
    assert.equal(h.confirmed.length,1)
})
test("Packaging finalizes preview and confirm once, directly showing the confirmed result",async()=>{
    const calls=[];let resolve;const h=wizardHarness(async input=>{calls.push(["preview",input]);return previewFixture},args=>{calls.push(["confirm",args]);return new Promise(done=>resolve=done)});h.goToPackaging()
    h.submit();h.submit();await settle()
    assert.deepEqual(calls.map(row=>row[0]),["preview","confirm"])
    assert.equal(calls[1][1].previewToken,"signed");assert.ok(calls[1][1].confirmationKey)
    assert.equal(h.submitButton().props["aria-busy"],true);assert.equal(h.node("fieldset").props.disabled,true)
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.packaging")
    resolve({...previewFixture,id:88,totalCost:19});await settle()
    assert.equal(h.confirmed.length,1);assert.equal(h.confirmed[0].totalCost,19)
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.result");assert.equal(h.node("Navigation"),undefined)
    assert.ok(h.node("Section",p=>p.title==="catalogQuote.ui.yourMix"));assert.ok(h.node("Section",p=>p.title==="catalogQuote.ui.configuration"));assert.ok(h.node("Section",p=>p.title==="catalogQuote.ui.packaging"));assert.ok(h.node("Section",p=>p.title==="catalogQuote.ui.quantity"))
})
test("network failure preserves selections and retry reuses preview and idempotency key",async()=>{
    let previews=0;const keys=[];const h=wizardHarness(async()=>{previews++;return previewFixture},async args=>{keys.push(args.confirmationKey);if(keys.length===1)throw new Error("offline");return {...previewFixture,id:88}});h.goToPackaging()
    h.submit();await settle()
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.packaging");assert.ok(h.node("p",p=>p.role==="alert"))
    assert.equal(h.node("Input",p=>p.id==="catalog-pallets").props.value,"1")
    h.submit();await settle()
    assert.equal(previews,1);assert.equal(keys[0],keys[1]);assert.equal(h.confirmed.length,1)
})
test("409 refreshes the preview without silent confirmation and requires a new click",async()=>{
    let previews=0,confirms=0;const h=wizardHarness(async()=>({...previewFixture,totalCost:++previews===1?12:22,previewToken:previews===1?"signed":"updated"}),async args=>{confirms++;if(confirms===1)throw {isAxiosError:true,response:{status:409}};assert.equal(args.previewToken,"updated");return {...previewFixture,totalCost:22,id:88}});h.goToPackaging()
    h.submit();await settle()
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.packaging");assert.equal(h.confirmed.length,0);assert.equal(confirms,1);assert.equal(previews,2)
    assert.ok(h.node("p",p=>p.role==="alert"&&p.children==="catalogQuote.changed"))
    assert.ok(h.node("p",p=>p.className?.includes("text-3xl")&&String(p.children).includes("22")))
    h.submit();await settle()
    assert.equal(previews,2);assert.equal(confirms,2);assert.equal(h.confirmed[0].totalCost,22)
})
test("preview failure stays in Packaging and retries without resetting the selection",async()=>{
    let attempts=0;const h=wizardHarness(async()=>{if(++attempts===1)throw new Error("offline");return previewFixture},async()=>({...previewFixture,id:88}));h.goToPackaging()
    h.submit();await settle();assert.equal(h.node("h2").props.children,"catalogQuote.steps.packaging")
    h.reenterPackaging();h.submit();await settle();assert.equal(h.confirmed.length,1)
})
test("failed 409 refresh requires displaying a fresh price before another confirmation",async()=>{
    let previews=0,confirms=0
    const h=wizardHarness(async()=>{if(++previews===2)throw new Error("offline");return {...previewFixture,totalCost:previews===1?12:22}},async()=>{if(++confirms===1)throw {isAxiosError:true,response:{status:409}};return {...previewFixture,id:88,totalCost:22}})
    h.goToPackaging()
    h.submit();await settle()
    h.submit();await settle()
    assert.equal(confirms,1);assert.equal(h.confirmed.length,0);assert.ok(h.node("p",p=>p.className?.includes("text-3xl")&&String(p.children).includes("22")))
    h.submit();await settle()
    assert.equal(confirms,2);assert.equal(h.confirmed[0].totalCost,22)
})
test("wizard displays loading, failed discovery and nothing-to-quote states",()=>{
    const harness=wizardHarness(async()=>({}));harness.query.isLoading=true;assert.equal(harness.render().type,"Spinner")
    harness.query.isLoading=false;harness.query.isError=true;assert.equal(harness.node("p",props=>props.role==="alert").props.children,"common.loadError")
    harness.query.isError=false;harness.query.data.categories[0].subCategories[0].availability="missing_recipe"
    assert.equal(harness.render().type,"Card")
})
test("representatives see pending packaging disabled and never subcategories without reference recipes; the admin sees both",()=>{
    const subCategories=availability=>[{id:3,displayName:"Fruit",availability:"ready",compositionMode:"single",rawMaterials:[],configurations:[]},{id:4,displayName:"Pending",availability:"missing_configuration",compositionMode:"blend",rawMaterials:[],configurations:[]},{id:5,displayName:"Unclassified",availability,compositionMode:null,rawMaterials:[],configurations:[]}]
    for(const mode of ["customer","admin"]){
        const h=wizardHarness(async()=>({}),undefined,mode);h.query.data.categories[0].subCategories=subCategories("missing_recipe")
        h.node("OptionCards").props.onChange(1)
        const options=h.node("OptionCards").props.options
        assert.deepEqual(options.map(o=>[o.value,o.disabled]),mode==="admin"?[[3,false],[4,true],[5,true]]:[[3,false],[4,true]])
        assert.equal(options[0].subtitle,"catalogQuote.ui.composition.single")
        assert.equal(options[1].subtitle,"catalogQuote.ui.availability.missing_configuration")
    }
})
test("single subcategories pick one raw material at 100%; blends need two or more of the chosen type",()=>{
    const harness=wizardHarness(async()=>({}))
    const subCategory=harness.query.data.categories[0].subCategories[0]
    subCategory.rawMaterials.push({rawMaterialId:2,displayName:"Broccoli",ingredientType:"vegetable"},{rawMaterialId:3,displayName:"Papaya",ingredientType:"fruit"})
    harness.goToMix()
    assert.equal(harness.node("h2").props.children,"catalogQuote.steps.single")
    harness.node("OptionCards",props=>props.options.some(row=>row.value==="fruit")).props.onChange("fruit")
    assert.equal(harness.node("MixBuilder").props.single,true)
    assert.deepEqual(harness.node("MixBuilder").props.materials.map(row=>row.rawMaterialId),[1,3])
    harness.node("MixBuilder").props.onChange(1,"100");harness.node("MixBuilder").props.onChange(3,"100")
    assert.deepEqual(harness.node("MixBuilder").props.percentages,{3:"100"})
    assert.equal(harness.node("Navigation").props.disabled,false)
    subCategory.compositionMode="blend"
    harness.node("MixBuilder").props.onChange(3,undefined);harness.node("MixBuilder").props.onChange(1,"100")
    assert.equal(harness.node("h2").props.children,"catalogQuote.steps.mix")
    assert.equal(harness.node("Navigation").props.disabled,true)
    harness.node("MixBuilder").props.onChange(1,"66.67");harness.node("MixBuilder").props.onChange(3,"33.33")
    assert.equal(harness.node("Navigation").props.disabled,false)
    harness.node("Navigation").props.onBack();harness.node("Navigation").props.onNext()
    assert.deepEqual(harness.node("MixBuilder").props.percentages,{1:"66.67",3:"33.33"})
})

function genericFixture(){
 const option=(id,packagingId=id)=>({id,packagingId,displayName:`Material ${id}`,isDefault:false})
 const config={id:3,configurationOrigin:"generic_configuration",fingerprint:"v1",presentationId:1,displayLabel:"16 oz",netWeightGrams:454,bagsPerBox:5,boxesPerPallet:60,unitsPerIntermediatePackage:null,packaging:{unit:{fixed:[],groups:[{key:"id:7",groupId:7,packagingGroupId:70,group:"Bolsas",selectionMode:"one",isRequired:true,options:[option(11,101)]}]},intermediate:{fixed:[],groups:[]},pallet:{fixed:[option(99)],groups:[{key:"id:8",groupId:8,packagingGroupId:80,group:"Cajas",selectionMode:"one",isRequired:true,options:[option(21,201),option(22,202)]},{key:"id:9",groupId:9,packagingGroupId:90,group:"Extras",selectionMode:"all",isRequired:false,options:[option(31,301),option(32,302)]}]}}}
 const catalog={categories:[{id:1,displayName:"Frutas",subCategories:[{id:2,displayName:"Congelados",availability:"ready",compositionMode:"single",rawMaterials:[{rawMaterialId:1,displayName:"Piña",ingredientType:"fruit"}],configurations:[config]}]}]}
 const state={categoryId:1,subCategoryId:2,configurationId:3,ingredientType:"fruit",isOrganic:false,percentages:{1:"100"},pallets:"1",choices:{}}
 return {config,catalog,state}
}
test("generic packaging: unique required option auto-selects; multiple options require choice; included rows are not submitted",()=>{
 const {resolveCatalogSelection}=loader()(statePath),{catalog,state}=genericFixture()
 let result=resolveCatalogSelection(catalog,state);assert.equal(result.groups[0].selectedId,11);assert.equal(result.groups[1].selectedId,undefined);assert.equal(result.input,null)
 state.choices={"pallet:catalog:80":202};result=resolveCatalogSelection(catalog,state);assert.ok(result.input);assert.deepEqual(result.input.packagingSelections,[{groupId:7,optionIds:[11]},{groupId:8,optionIds:[22]}]);assert.equal("selectedPalletMaterialIds" in result.input,false)
})
test("generic packaging: optional cumulative group is omitted until enabled and sends the full set",()=>{
 const {resolveCatalogSelection}=loader()(statePath),{catalog,state}=genericFixture();state.choices={"pallet:catalog:80":201,"pallet:catalog:90":301}
 assert.deepEqual(resolveCatalogSelection(catalog,state).input.packagingSelections.at(-1),{groupId:9,optionIds:[31,32]})
 state.choices["pallet:catalog:90"]=0;assert.equal(resolveCatalogSelection(catalog,state).input.packagingSelections.length,2)
})
test("generic packaging: required empty groups and invalid configurations block, optional empty does not",()=>{
 const {resolveCatalogSelection}=loader()(statePath),{catalog,state,config}=genericFixture();state.choices={"pallet:catalog:80":201};config.packaging.pallet.groups[1].options=[];assert.ok(resolveCatalogSelection(catalog,state).input)
 config.packaging.unit.groups[0].options=[];assert.equal(resolveCatalogSelection(catalog,state).input,null)
 config.packaging.unit.groups[0].isRequired=false;assert.ok(resolveCatalogSelection(catalog,state).input)
 config.configurationIssue="errors.generic_packaging_configuration";assert.equal(resolveCatalogSelection(catalog,state).input,null)
 catalog.categories[0].subCategories[0].configurations=[];assert.equal(resolveCatalogSelection(catalog,state).input,null)
})
test("generic packaging: presentation changes preserve compatible material, remap association IDs, discard incompatible choices",()=>{
 const {resolveCatalogSelection,reconcileCatalogChoices}=loader()(statePath),{catalog,state,config}=genericFixture();state.choices={"pallet:catalog:80":202,"unit:catalog:70":999}
 config.packaging.pallet.groups[0].options[1].id=222
 state.choices=reconcileCatalogChoices(config,state.choices);assert.deepEqual(state.choices,{"pallet:catalog:80":202});assert.equal(resolveCatalogSelection(catalog,state).input.packagingSelections[1].optionIds[0],222)
})

test("new-product wizard: single-material kit types are included; several corner boards require a choice of type, never quantity",async()=>{
    const calls=[];const h=wizardHarness(async input=>{calls.push(input);return previewFixture},async()=>{throw new Error("offline")})
    const option=(id,displayName)=>({id,packagingId:id,displayName,isDefault:false})
    h.query.data.palletKit=[{type:"TARIMA",group:"Tarima",options:[option(901,"Tarima del kit")]},{type:"ESQUINERO",group:"Esquinero",options:[option(902,"Esquinero de cartón"),option(904,"Esquinero de madera")]},{type:"STRETCH",group:"Stretch",options:[option(903,"Stretch del kit")]}]
    h.goToPackaging()
    const included=JSON.stringify(h.node("ul",p=>p["aria-label"]==="site.quoteRequest.form.wizard.materials.included").props.children)
    assert.ok(included.includes("Tarima del kit")&&included.includes("Stretch del kit")&&!included.includes("Esquinero"))
    assert.equal(h.submitButton().props.disabled,true)
    h.node("OptionCards",p=>p.options.some(o=>o.value===904)).props.onChange(904)
    assert.equal(h.submitButton().props.disabled,false)
    h.submit();await settle()
    assert.deepEqual(calls[0].palletKitSelections,[{type:"ESQUINERO",packagingId:904}])
    assert.deepEqual(calls[0].packagingSelections,[])
})

test("fixed quoter: single-material kit types are included, several are a required choice sent apart from the SKU rows",()=>{
    const { palletKitGroups, palletKitIncluded, palletKitSelections } = loader()("src/feature/quote/util/quotePalletKit.util.ts")
    const option=(id,displayName)=>({id,packagingId:id,displayName,isDefault:false})
    const kit=[{type:"TARIMA",group:"Tarima",options:[option(901,"Tarima")]},{type:"ESQUINERO",group:"Esquinero",options:[option(902,"Cartón"),option(904,"Madera")]},{type:"STRETCH",group:"Stretch",options:[option(903,"Stretch")]}]
    assert.deepEqual(palletKitIncluded(kit).map(row=>row.id),[901,903])
    const pending=palletKitGroups(kit,{})
    assert.deepEqual(pending.map(group=>[group.key,group.level,group.selectedId]),[["pallet:kit:ESQUINERO","pallet",undefined]])
    assert.deepEqual(palletKitSelections(pending),{})
    const chosen=palletKitGroups(kit,{"pallet:kit:ESQUINERO":904})
    assert.deepEqual(palletKitSelections(chosen),{palletKitSelections:[{type:"ESQUINERO",packagingId:904}]})
    assert.equal(palletKitGroups(kit,{"pallet:kit:ESQUINERO":999})[0].selectedId,undefined)
    assert.deepEqual(palletKitGroups([], {}),[])
})

test("API error adapter exposes only status and a textual public message", () => {
    const { apiErrorResponse } = loader()("src/shared/api/apiErrorResponse.ts")
    assert.equal(apiErrorResponse(new Error("offline")), undefined)
    assert.equal(apiErrorResponse({ isAxiosError: true }), undefined)
    assert.deepEqual(apiErrorResponse({ isAxiosError: true, response: { status: 409, data: { message: "Changed", sql: "private" } } }), { status: 409, message: "Changed" })
    assert.deepEqual(apiErrorResponse({ isAxiosError: true, response: { status: 422, data: { message: 123 } } }), { status: 422, message: undefined })
})

test("new-product preview and confirmation carry the selected client for automatic pallets", async () => {
    const previews = [], confirms = []
    const order = { id: "72db466a-e594-48b7-9864-128b4b305b08", clientId: 77, clientName: "HEB" }
    const h = wizardHarness(async input => { previews.push(input); return previewFixture }, async input => { confirms.push(input); return { ...previewFixture, id: 88 } }, "customer", order)
    h.goToPackaging()
    h.flushTimers()
    await settle()
    h.submit()
    await settle()
    assert.equal(previews.at(-1).clientId, 77)
    assert.equal(confirms[0].input.clientId, 77)
    assert.deepEqual(confirms[0].order, order)
})

test("pallet rules form saves a default and client exception without a SKU setting", () => {
    let slots = [], cursor = 0
    const saved = []
    const React = { useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value }] } }
    const Rules = loader({ react: React, "react-i18next": { useTranslation: () => ({ t: key => key }) },
        "@/shared/component/card.component": { Card: "Card" }, "@/shared/component/select.component": { Select: "Select" }, "@/shared/component/button.component": { Button: "Button" },
    })("src/feature/palletKit/component/palletKitRules.component.tsx").PalletKitRules
    const props = { kit: { types: [{ type: "TARIMA", materials: [{ id: 1, displayName: "Taco", code: "A" }, { id: 2, displayName: "10 lb", code: "B" }] }] }, clients: [{ id: 77, name: "HEB" }], busy: false, onSave: rule => saved.push(rule) }
    function all(tree) { if (!tree || typeof tree !== "object") return []; return [tree, ...[].concat(tree.props?.children ?? []).flat(Infinity).flatMap(all)] }
    function render() { cursor = 0; return all(Rules(props)) }
    const select = (id, value) => render().find(n => n.props.id === id).props.onChange({ target: { value } })
    select("kit-default-pallet", "1")
    select("kit-rule-client", "77")
    select("kit-rule-pallet", "2")
    render().find(n => n.type === "Button" && n.props.children === "palletKit.rules.add").props.onClick()
    const save = render().find(n => n.type === "Button" && n.props.children === "palletKit.rules.save")
    assert.equal(save.props.disabled, false)
    save.props.onClick()
    assert.deepEqual(saved, [{ defaultPackagingId: 1, overrides: [{ clientId: 77, packagingId: 2 }] }])
})
