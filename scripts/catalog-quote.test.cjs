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
            if (name in overrides) return overrides[name]
            if (name.startsWith("@/") || name.startsWith(".")) {
                const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(file), name)
                return load([`${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate)))
            }
            return require(name)
        }
        vm.runInThisContext(`(function(require,module,exports,requestAnimationFrame,cancelAnimationFrame){${source}\n})`, { filename: file })(localRequire,module,module.exports,overrides.frames?.request,overrides.frames?.cancel)
        return module.exports
    }
    return load
}
const statePath = "src/feature/customQuote/component/catalogQuoteState.ts"
test("shared order survives navigation and refresh, preserves custom composition, locks customer and isolates representatives", () => {
    const previousStorage = globalThis.sessionStorage
    const storage = new Map()
    globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
    let current, salespersonId = 42
    const react = { useState: initial => { if (!current) current = typeof initial === "function" ? initial() : initial; return [current, value => { current = value }] } }
    const useOrder = loader({ react, "@/shared/auth/salesperson/useSalespersonAuth": { useSalespersonAuth: () => ({ salesperson: { id: salespersonId } }) } })("src/feature/quote/component/useSharedQuoteOrder.ts").useSharedQuoteOrder
    try {
        let order = useOrder(); order.setClientName("Customer A"); order = useOrder()
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
    const send=async()=>({message:"sent"})
    const order={lines:[],clientName:"Customer",identity:{id:"order",clientName:"Customer"},addLine:line=>order.lines.push(line),clear:()=>{order.lines=[]},setClientName:()=>{}}
    const Page=loader({react,"react-router-dom":{Link:"Link"},"react-i18next":{useTranslation:()=>({t:key=>key})},"@/feature/quote/component/useSharedQuoteOrder":{useSharedQuoteOrder:()=>order},"@/feature/quote/component/quoteOrderClient.component":{QuoteOrderClient:"Client"},"../component/catalogQuoteWizard.component":{CatalogQuoteWizard:"Wizard"},"@/feature/quote/component/quotePdfButton.component":{QuotePdfButton:"Pdf"},"@/feature/quote/component/quotedOrderSummary.component":{QuotedOrderSummary:"Summary"},"@/feature/quote/api/quote.api":{sendQuotePdfEmailAPI:send},"@/shared/component/siteContainer.component":{SiteContainer:"Container"}})("src/feature/customQuote/page/catalogQuoteRequest.page.tsx").CatalogQuoteRequestPage
    const nodes=tree=>!tree||typeof tree!=="object"?[]:[tree,...[].concat(tree.props?.children??[]).flat(Infinity).flatMap(nodes)]
    const render=()=>{cursor=0;return nodes(Page())}
    const persisted={totalCost:19,composition:{rawMaterials:[{displayName:"Mango",percentage:100}]},configuration:{snapshot:{isOrganic:true}}}
    render().find(row=>row.type==="Wizard").props.onConfirmed(persisted)
    const summary=render().find(row=>row.type==="Summary")
    assert.equal(summary.props.lines[0],persisted)
    assert.equal(summary.props.pdfAction.props.lines[0],persisted)
    assert.equal(summary.props.pdfAction.props.sendEmailAPI,send)
    assert.equal(summary.props.pdfAction.props.showCostBreakdown,false)
    assert.equal(summary.props.pdfAction.props.orderClientName,"Customer")
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
    for (const [key,value] of [["isOrganic",true],["ingredientType","pulp"]]) { const result=change(state,key,value); assert.deepEqual(result.percentages,{}); assert.equal(result.configurationId,null); assert.deepEqual(result.choices,{}) }
    const config=change(state,"configurationId",9); assert.deepEqual(config.percentages,state.percentages); assert.deepEqual(config.choices,{})
})
test("packaging chooser permits configured options and restores configured defaults only", () => {
    const { catalogMaterialGroups } = loader()(statePath)
    const option = (id,isDefault) => ({id,packagingId:id,displayName:"Bag",isDefault})
    const config = { packaging:{unit:{groups:[{key:"id:1",group:"Bag",options:[option(1,true),option(2,false)]}]},intermediate:{groups:[]},pallet:{groups:[]}} }
    assert.equal(catalogMaterialGroups(config,{"unit:id:1":2})[0].selectedId,2)
    assert.equal(catalogMaterialGroups(config,{"unit:id:1":999})[0].selectedId,1)
    config.packaging.unit.groups[0].options[0].isDefault=false
    assert.equal(catalogMaterialGroups(config,{})[0].selectedId,undefined)
})
test("legacy and new document mapping preserve frozen composition and certification without source data", () => {
    const { toCustomQuoteDocumentLine } = loader()("src/feature/customQuote/component/customQuoteComposition.ts")
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
    for (const url of ["/admin/quotes", "/admin/quotes/calculator", "/admin/juice-config"]) assert.ok(items.some(item => item.url === url))
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
    const input={categoryId:1,subCategoryId:2,configurationId:3,ingredientType:"fruit",isOrganic:false,requestedPallets:1,rawMaterialMix:[{rawMaterialId:1,percentage:100}],selectedUnitMaterialIds:[],selectedIntermediateMaterialIds:[],selectedPalletMaterialIds:[]}
    assert.equal(schema.safeParse(input).success,true); assert.equal(schema.safeParse({...input,totalCost:1}).success,false)
})

function wizardHarness(previewAPI, confirmAPI, mode = "customer") {
    let slots=[],cursor=0,confirmed=[],effects=[],frameId=0
    const frames=new Map()
    const react={__esModule:true,useState:initial=>{ const index=cursor++; if(!(index in slots)) slots[index]=typeof initial==="function"?initial():initial; return [slots[index],value=>{slots[index]=typeof value==="function"?value(slots[index]):value}] },useRef:initial=>{const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index]},useEffect:(effect,deps)=>{const index=cursor++;const prior=slots[index];if(!prior||deps.some((value,i)=>value!==prior.deps[i])){prior?.cleanup?.();slots[index]={deps};effects.push(()=>{slots[index].cleanup=effect()})}}}
    const config={id:5,fingerprint:"hash",presentationId:7,displayLabel:"500 g",netWeightGrams:500,bagsPerBox:6,boxesPerPallet:40,unitsPerIntermediatePackage:null,packaging:{unit:{fixed:[],groups:[]},intermediate:{fixed:[],groups:[]},pallet:{fixed:[],groups:[]}}}
    const query={data:{categories:[{id:1,displayName:"Frozen",subCategories:[{id:3,displayName:"Fruit blends",rawMaterials:[{rawMaterialId:1,displayName:"Mango",ingredientType:"fruit",isOrganic:false}],configurations:[config]}]}]},refetch:async()=>{}}
    const overrides={react,"@tanstack/react-query":{useQuery:()=>query},"react-i18next":{useTranslation:()=>({t:key=>key,i18n:{language:"en"}})},"../api/catalogQuote.api":{discoverCatalogAPI:async()=>query.data,previewCatalogAPI:previewAPI,confirmCatalogAPI:confirmAPI ?? (async()=>({id:88,configuration:{rawMaterialMix:[{rawMaterialId:1,percentage:100}]},breakdown:{rawMaterials:[{rawMaterialId:1,displayName:"Mango"}],ingredients:[]}}))}}
    overrides["../api/adminCatalogQuote.api"] = { discoverAdminCatalogAPI: async () => query.data, previewAdminCatalogAPI: mode === "admin" ? previewAPI : async () => { throw new Error("Customer must not use admin calculation") } }
    if (mode === "admin") overrides["../api/catalogQuote.api"].previewCatalogAPI = async () => { throw new Error("Admin must not use customer preview") }
    overrides["@/feature/quote/component/quoteResultCard.component"] = { QuoteResultCard: "CostBreakdown" }
    for (const [name,exports] of [["optionCards","OptionCards"],["input","Input"],["button","Button"],["card","Card"],["spinner","Spinner"]]) overrides[`@/shared/component/${name}.component`]={[exports]:exports}
    overrides["@/feature/quote/component/quoteWizardBackButton.component"]={QuoteWizardBackButton:"Back"}
    overrides["@/feature/quote/component/quoteMaterialGroups.component"]={QuoteMaterialGroups:"Groups"}
    overrides["@/feature/quote/component/quotePalletsStep.component"]={QuotePalletsStep:"Pallets"}
    overrides["./catalogQuoteUi.component"]={CatalogQuoteContext:"Context",CatalogQuoteStepper:"Stepper",CatalogQuoteSelectionCards:"OptionCards",CatalogQuoteNavigation:"Navigation",CatalogQuoteSection:"Section"}
    overrides["./catalogQuoteMixBuilder.component"]={CatalogQuoteMixBuilder:"MixBuilder"}
    overrides.frames={request:callback=>{frames.set(++frameId,callback);return frameId},cancel:id=>frames.delete(id)}
    const component=loader(overrides)("src/feature/customQuote/component/catalogQuoteWizard.component.tsx").CatalogQuoteWizard
    function render(){cursor=0;const tree=component(mode === "admin" ? {mode} : {onConfirmed:line=>confirmed.push(line)});const pending=effects;effects=[];pending.forEach(effect=>effect());return tree}
    function flushFrame(){render();const pending=[...frames.values()];frames.clear();pending.forEach(callback=>callback());render()}
    function all(tree){if(!tree||typeof tree!=="object")return [];if(typeof tree.type==="function")return all(tree.type(tree.props));return [tree,...[].concat(tree.props?.children??[]).flat(Infinity).flatMap(all)]}
    function node(type,predicate=()=>true){return all(render()).find(row=>row.type===type&&predicate(row.props))}
    function goToConfiguration(){node("OptionCards").props.onChange(1);node("OptionCards").props.onChange(3);node("Navigation").props.onNext();node("MixBuilder").props.onChange(1,"100");node("Navigation").props.onNext()}
    function goToPackaging(){goToConfiguration();node("OptionCards").props.onChange(5);flushFrame();flushFrame()}
    return {node,render,goToConfiguration,goToPackaging,flushFrame,confirmed,query}
}
test("configuration selection paints once, advances without Continue and survives Previous",()=>{
    const h=wizardHarness(async()=>({}));h.goToConfiguration()
    assert.equal(h.node("Navigation").props.backOnly,true)
    assert.equal(h.node("Navigation").props.onNext,undefined)
    const click=h.node("OptionCards").props.onChange
    click(999);h.flushFrame();h.flushFrame()
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.configuration")
    click(5);click(5);click(999)
    assert.equal(h.node("OptionCards").props.value,5)
    h.flushFrame();assert.equal(h.node("h2").props.children,"catalogQuote.steps.configuration")
    h.flushFrame();assert.equal(h.node("h2").props.children,"catalogQuote.steps.packaging")
    click(5);h.flushFrame();h.flushFrame()
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.packaging")
    h.node("Navigation").props.onBack()
    assert.equal(h.node("OptionCards").props.value,5)
    h.flushFrame();h.flushFrame()
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.configuration")
})
test("changing configuration clears old packaging choices and restores only new defaults",()=>{
    const h=wizardHarness(async()=>({}));const configs=h.query.data.categories[0].subCategories[0].configurations
    const packaging=id=>({unit:{fixed:[],groups:[{key:"bag",group:"Bag",options:[{id,packagingId:id,displayName:`Bag ${id}`,isDefault:true},{id:id+1,packagingId:id+1,displayName:"Alternative",isDefault:false}]}]},intermediate:{fixed:[],groups:[]},pallet:{fixed:[],groups:[]}})
    configs[0].packaging=packaging(10);configs.push({...configs[0],id:6,packaging:packaging(20)})
    h.goToPackaging();h.node("OptionCards",p=>p.options.some(o=>o.value===11)).props.onChange(11)
    h.node("Navigation").props.onBack();const click=h.node("OptionCards").props.onChange
    click(6);click(5)
    assert.equal(h.node("OptionCards").props.value,6)
    h.flushFrame();h.flushFrame()
    assert.equal(h.node("OptionCards",p=>p.options.some(o=>o.value===20)).props.value,20)
    h.node("Navigation").props.onBack()
    assert.equal(h.node("OptionCards").props.value,6)
})
test("Previous cancels a pending configuration advance",()=>{
    const h=wizardHarness(async()=>({}));h.goToConfiguration()
    h.node("OptionCards").props.onChange(5);h.flushFrame()
    h.node("Navigation").props.onBack();h.flushFrame();h.flushFrame()
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.mix")
})
test("wizard ignores obsolete async preview after user navigates back",async()=>{
    let resolve;const harness=wizardHarness(()=>new Promise(done=>resolve=done));harness.goToPackaging()
    const work=harness.node("form").props.onSubmit({preventDefault(){}})
    harness.node("Navigation").props.onBack()
    resolve({totalCost:1});await Promise.resolve();await Promise.resolve()
    assert.equal(harness.node("h2").props.children,"catalogQuote.steps.configuration")
    assert.equal(harness.confirmed.length,0)
    void work
})
const previewFixture={productDisplayName:"CUSTOM FRUIT BLEND",variantLabel:"6 x 500 g",bagsPerBox:6,requestedPallets:1,totalCost:12,totalWeightPounds:120,previewToken:"signed",totalUnits:240,configuration:{isOrganic:false,pallet:{boxesPerPallet:40},rawMaterialMix:[{rawMaterialId:1,percentage:100}]},breakdown:{rawMaterials:[{rawMaterialId:1,displayName:"Mango"}],unitMaterials:[],intermediateMaterials:[],palletMaterials:[]}}
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve()}

test("admin traverses the shared wizard, calculates selected packaging/pallets once and never confirms", async () => {
    const calls=[];let complete;const h=wizardHarness(input=>{calls.push(input);return new Promise(resolve=>complete=resolve)},()=>{throw new Error("Customer persistence must never run")},"admin")
    h.query.data.categories[0].subCategories[0].configurations[0].packaging.unit.groups=[{key:"bag",group:"Bag",options:[{id:10,packagingId:100,displayName:"Default bag",isDefault:true},{id:11,packagingId:101,displayName:"Custom bag",isDefault:false}]}]
    h.goToPackaging()
    h.node("OptionCards",p=>p.options.some(row=>row.value===11)).props.onChange(11)
    h.node("Input",p=>p.id==="catalog-pallets").props.onChange({target:{value:"3"}})
    const submit=h.node("form").props.onSubmit
    submit({preventDefault(){}});submit({preventDefault(){}});await settle()
    assert.equal(calls.length,1)
    assert.equal(calls[0].requestedPallets,3)
    assert.deepEqual(calls[0].selectedUnitMaterialIds,[11])
    assert.deepEqual(calls[0].rawMaterialMix,[{rawMaterialId:1,percentage:100}])
    assert.equal(h.node("fieldset").props.disabled,true)
    complete({...previewFixture,requestedPallets:3,totalCost:789});await settle()
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.result")
    assert.equal(h.node("CostBreakdown").props.result.totalCost,789)
    assert.equal(h.confirmed.length,0)
    assert.ok(h.node("p",p=>p.children==="adminQuoteCalculator.calculatedHint"))
})

test("admin rejects incomplete mix and quantity, retains failed selections and discards obsolete calculations",async()=>{
    let calls=0,finish;const h=wizardHarness(async()=>{calls++;if(calls===1)throw new Error("offline");return new Promise(resolve=>finish=resolve)},()=>{throw new Error("No confirmation")},"admin")
    h.goToPackaging()
    h.node("Input",p=>p.id==="catalog-pallets").props.onChange({target:{value:"0"}})
    h.node("form").props.onSubmit({preventDefault(){}});await settle();assert.equal(calls,0)
    h.node("Input",p=>p.id==="catalog-pallets").props.onChange({target:{value:"2"}})
    h.node("form").props.onSubmit({preventDefault(){}});await settle()
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.packaging")
    assert.equal(h.node("Input",p=>p.id==="catalog-pallets").props.value,"2")
    assert.ok(h.node("p",p=>p.role==="alert"&&p.children==="catalogQuote.previewError"))
    h.node("form").props.onSubmit({preventDefault(){}});await settle()
    h.node("Navigation").props.onBack()
    finish({...previewFixture,totalCost:123});await settle()
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.configuration")
    assert.equal(h.node("CostBreakdown"),undefined)
    h.node("Navigation").props.onBack()
    h.node("MixBuilder").props.onChange(1,"99.99")
    assert.equal(h.node("Navigation").props.disabled,true)
    assert.equal(h.confirmed.length,0)
})

test("admin API uses staff transport and calculation routes only", async()=>{
    const calls=[],api={get:async path=>{calls.push(path);return {data:{data:{categories:[]}}}},post:async(path,input)=>{calls.push([path,input]);return {data:{data:previewFixture}}}}
    const methods=loader({"@/shared/api/api":{__esModule:true,default:api},"../schema/customQuote.schema":{customQuoteCalculationSchema:{parse:value=>value}}})("src/feature/customQuote/api/adminCatalogQuote.api.ts")
    assert.deepEqual(await methods.discoverAdminCatalogAPI(),{categories:[]})
    assert.equal((await methods.previewAdminCatalogAPI({requestedPallets:3})).totalCost,12)
    assert.deepEqual(calls,["/admin/quotes/catalog-configurations",["/admin/quotes/catalog-preview",{requestedPallets:3}]])
})

test("calculator selector opens customizable admin and preserves fixed preview submission",()=>{
    const React=require("react"),calls=[];let params=new URLSearchParams()
    const order={wizardStep:"product",quotedLines:[],formResetKey:0,clearCurrentResult:()=>calls.push("clear"),addQuotedLine:()=>{}}
    const overrides={react:React,"react-i18next":{useTranslation:()=>({t:key=>key})},"react-router-dom":{useSearchParams:()=>[params,next=>{params=next}]},"@tanstack/react-query":{useQuery:()=>({data:{data:[]}}),useMutation:options=>({mutate:input=>calls.push([options.mutationFn,input])})},"@/feature/quote/api/adminQuote.api":{previewAdminQuoteAPI:"fixed-preview"},"@/feature/quote/component/useQuoteOrder":{useQuoteOrder:()=>order},"@/feature/customQuote/page/adminCatalogQuoteCalculator.page":{AdminCatalogQuoteCalculatorPage:"CustomAdmin"},"@/shared/component/pageContainer.component":{PageContainer:"Container"}}
    for(const [file,name] of [["quoteCalculatorForm","QuoteCalculatorForm"],["quoteWizardContent","QuoteWizardContent"],["quoteResultCard","QuoteResultCard"],["quotedOrderSummary","QuotedOrderSummary"],["quotePdfButton","QuotePdfButton"]])overrides[`@/feature/quote/component/${file}.component`]={ [name]:name }
    const Page=loader(overrides)("src/feature/quote/page/adminQuoteCalculator.page.tsx").AdminQuoteCalculatorPage
    const nodes=tree=>!tree||typeof tree!=="object"?[]:[tree,...[].concat(tree.props?.children??[]).flat(Infinity).flatMap(nodes)]
    const fixed=nodes(Page()).find(row=>row.type?.name==="FixedAdminQuoteCalculatorPage")
    assert.ok(fixed)
    const content=nodes(fixed.type()).find(row=>row.type==="QuoteWizardContent")
    content.props.form.props.onSubmit({productVariantId:10,requestedPallets:2})
    assert.deepEqual(calls,["clear",["fixed-preview",{productVariantId:10,requestedPallets:2}]])
    nodes(Page()).find(row=>row.type==="button"&&row.props.children==="adminQuote.types.customizable").props.onClick()
    assert.equal(params.get("type"),"customizable")
    assert.ok(nodes(Page()).find(row=>row.type==="CustomAdmin"))
    assert.equal(nodes(Page()).find(row=>row.type?.name==="FixedAdminQuoteCalculatorPage"),undefined)
})

test("invalid pallet quantities block submission without preview or confirmation",async()=>{
    let calls=0
    const h=wizardHarness(async()=>{calls++;return previewFixture},async()=>{calls++;return {...previewFixture,id:88}})
    h.goToPackaging()
    for(const value of ["0","1.5","100001",""]){
        h.node("Input",p=>p.id==="catalog-pallets").props.onChange({target:{value}})
        assert.equal(h.node("Input",p=>p.id==="catalog-pallets").props["aria-invalid"],true)
        assert.equal(h.node("Navigation").props.disabled,true)
        h.node("form").props.onSubmit({preventDefault(){}})
        await settle()
        assert.equal(calls,0)
    }
    h.node("Input",p=>p.id==="catalog-pallets").props.onChange({target:{value:"2"}})
    assert.equal(h.node("Navigation").props.disabled,false)
})

test("obsolete confirmation cannot persist or replace a newer pending request",async()=>{
    const confirmations=[]
    const h=wizardHarness(async()=>previewFixture,()=>new Promise(resolve=>confirmations.push(resolve)))
    h.goToPackaging()
    h.node("form").props.onSubmit({preventDefault(){}});await settle()
    h.node("Navigation").props.onBack()
    h.node("OptionCards").props.onChange(5);h.flushFrame();h.flushFrame()
    h.node("form").props.onSubmit({preventDefault(){}});await settle()
    confirmations[0]({...previewFixture,id:87});await settle()
    assert.equal(h.confirmed.length,0)
    assert.equal(h.node("Navigation").props.pending,true)
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
    h.goToPackaging();h.node("form").props.onSubmit({preventDefault(){}});await settle()
    assert.equal(refetches,1)
    h.node("Navigation").props.onBack()
    h.node("OptionCards").props.onChange(5);h.flushFrame();h.flushFrame()
    h.node("form").props.onSubmit({preventDefault(){}});await settle()
    resolveRefresh({...previewFixture,previewToken:"obsolete",totalCost:999});await settle()
    assert.equal(h.confirmed.length,0)
    assert.equal(h.node("Navigation").props.pending,true)
    h.node("form").props.onSubmit({preventDefault(){}});await settle()
    assert.equal(confirms,2)
    resolveConfirmation({...previewFixture,id:88});await settle()
    assert.equal(h.confirmed.length,1)
})
test("Packaging finalizes preview and confirm once, directly showing the confirmed result",async()=>{
    const calls=[];let resolve;const h=wizardHarness(async input=>{calls.push(["preview",input]);return previewFixture},args=>{calls.push(["confirm",args]);return new Promise(done=>resolve=done)});h.goToPackaging()
    const submit=h.node("form").props.onSubmit;submit({preventDefault(){}});submit({preventDefault(){}});await settle()
    assert.deepEqual(calls.map(row=>row[0]),["preview","confirm"])
    assert.equal(calls[1][1].previewToken,"signed");assert.ok(calls[1][1].confirmationKey)
    assert.equal(h.node("Navigation").props.pending,true);assert.equal(h.node("fieldset").props.disabled,true)
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.packaging")
    resolve({...previewFixture,id:88,totalCost:19});await settle()
    assert.equal(h.confirmed.length,1);assert.equal(h.confirmed[0].totalCost,19)
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.result");assert.equal(h.node("Navigation"),undefined)
    assert.ok(h.node("Section",p=>p.title==="catalogQuote.ui.yourMix"));assert.ok(h.node("Section",p=>p.title==="catalogQuote.ui.configuration"));assert.ok(h.node("Section",p=>p.title==="catalogQuote.ui.packaging"));assert.ok(h.node("Section",p=>p.title==="catalogQuote.ui.quantity"))
})
test("network failure preserves selections and retry reuses preview and idempotency key",async()=>{
    let previews=0;const keys=[];const h=wizardHarness(async()=>{previews++;return previewFixture},async args=>{keys.push(args.confirmationKey);if(keys.length===1)throw new Error("offline");return {...previewFixture,id:88}});h.goToPackaging()
    h.node("form").props.onSubmit({preventDefault(){}});await settle()
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.packaging");assert.ok(h.node("p",p=>p.role==="alert"))
    assert.equal(h.node("Input",p=>p.id==="catalog-pallets").props.value,"1")
    h.node("form").props.onSubmit({preventDefault(){}});await settle()
    assert.equal(previews,1);assert.equal(keys[0],keys[1]);assert.equal(h.confirmed.length,1)
})
test("409 refreshes the preview without silent confirmation and requires a new click",async()=>{
    let previews=0,confirms=0;const h=wizardHarness(async()=>({...previewFixture,totalCost:++previews===1?12:22,previewToken:previews===1?"signed":"updated"}),async args=>{confirms++;if(confirms===1)throw {isAxiosError:true,response:{status:409}};assert.equal(args.previewToken,"updated");return {...previewFixture,totalCost:22,id:88}});h.goToPackaging()
    h.node("form").props.onSubmit({preventDefault(){}});await settle()
    assert.equal(h.node("h2").props.children,"catalogQuote.steps.packaging");assert.equal(h.confirmed.length,0);assert.equal(confirms,1);assert.equal(previews,2)
    assert.ok(h.node("output",p=>p["aria-live"]==="polite"))
    h.node("form").props.onSubmit({preventDefault(){}});await settle()
    assert.equal(previews,2);assert.equal(confirms,2);assert.equal(h.confirmed[0].totalCost,22)
})
test("preview failure stays in Packaging and retries without resetting configuration",async()=>{
    let attempts=0;const h=wizardHarness(async()=>{if(++attempts===1)throw new Error("offline");return previewFixture},async()=>({...previewFixture,id:88}));h.goToPackaging()
    h.node("form").props.onSubmit({preventDefault(){}});await settle();assert.equal(h.node("h2").props.children,"catalogQuote.steps.packaging")
    h.node("Navigation").props.onBack();assert.equal(h.node("OptionCards").props.value,5)
    h.node("OptionCards").props.onChange(5);h.flushFrame();h.flushFrame();h.node("form").props.onSubmit({preventDefault(){}});await settle();assert.equal(h.confirmed.length,1)
})
test("failed 409 refresh requires displaying a fresh price before another confirmation",async()=>{
    let previews=0,confirms=0
    const h=wizardHarness(async()=>{if(++previews===2)throw new Error("offline");return {...previewFixture,totalCost:previews===1?12:22}},async()=>{if(++confirms===1)throw {isAxiosError:true,response:{status:409}};return {...previewFixture,id:88,totalCost:22}})
    h.goToPackaging()
    h.node("form").props.onSubmit({preventDefault(){}});await settle()
    h.node("form").props.onSubmit({preventDefault(){}});await settle()
    assert.equal(confirms,1);assert.equal(h.confirmed.length,0);assert.ok(h.node("output",p=>p["aria-live"]==="polite"))
    h.node("form").props.onSubmit({preventDefault(){}});await settle()
    assert.equal(confirms,2);assert.equal(h.confirmed[0].totalCost,22)
})
test("wizard displays loading and failed discovery states",()=>{
    const harness=wizardHarness(async()=>({}));harness.query.isLoading=true;assert.equal(harness.render().type,"Spinner")
    harness.query.isLoading=false;harness.query.isError=true;assert.equal(harness.node("p",props=>props.role==="alert").props.children,"common.loadError")
})

test("mix search receives only compatible materials and wizard navigation preserves percentages",()=>{
    const harness=wizardHarness(async()=>({}))
    harness.query.data.categories[0].subCategories[0].rawMaterials.push(
        {rawMaterialId:2,displayName:"Broccoli",ingredientType:"vegetable",isOrganic:false},
        {rawMaterialId:3,displayName:"Organic mango",ingredientType:"fruit",isOrganic:true}
    )
    harness.node("OptionCards").props.onChange(1)
    harness.node("OptionCards").props.onChange(3)
    harness.node("OptionCards",props=>props.options.some(row=>row.value==="fruit")).props.onChange("fruit")
    harness.node("Navigation").props.onNext()
    assert.deepEqual(harness.node("MixBuilder").props.materials.map(row=>row.rawMaterialId),[1])
    harness.node("MixBuilder").props.onChange(1,"33.33")
    harness.node("Navigation").props.onBack()
    harness.node("Navigation").props.onNext()
    assert.deepEqual(harness.node("MixBuilder").props.percentages,{1:"33.33"})
})
