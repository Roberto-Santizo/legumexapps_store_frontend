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

const all=tree=>!tree||typeof tree!=="object"?[]:[tree,...[].concat(tree.props?.children??[]).flat(Infinity).flatMap(all)]
function harness(file,extra={}){
 let slots=[],cursor=0,params=new URLSearchParams(),permissions=["quotes:view","customQuotes:view"],query={data:{data:[]}},queries=[]
 const react={useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=typeof initial==="function"?initial():initial;return[slots[i],v=>{slots[i]=typeof v==="function"?v(slots[i]):v}]},Suspense:"Suspense",useEffect:()=>{},useRef:initial=>({current:initial})}
 const overrides={react,"react-i18next":{useTranslation:()=>({t:key=>key})},"react-router-dom":{useSearchParams:()=>[params,v=>{params=v}],Navigate:"Navigate",Link:"Link"},"@/shared/auth/usePermission":{usePermission:()=>({hasPermission:p=>permissions.includes(p)})},"@/shared/auth/PermissionGate":{AccessDenied:"Denied"},"@/shared/router/lazyWithRetry":{lazyWithRetry:load=>({load})},"@tanstack/react-query":{useQuery:options=>{queries.push(options);return query}},"@/feature/quote/api/adminQuote.api":{getAllQuotesAPI:filters=>filters},"@/feature/customQuote/api/adminCustomQuote.api":{getAdminCustomQuotesAPI:filters=>filters},...extra}
 for(const [name,exportName] of [["pageContainer","PageContainer"],["card","Card"],["input","Input"],["spinner","Spinner"],["select","Select"],["formField","FormField"]]) overrides["@/shared/component/"+name+".component"]={[exportName]:exportName}
 overrides["@/feature/dashboard/component/dateRangeFilter.component"]={DateRangeFilter:"DateRange"};overrides["@/feature/customQuote/component/adminCustomQuoteTable.component"]={AdminCustomQuoteTable:"CustomTable"};overrides["@/feature/quote/component/quoteResultCard.component"]={QuoteResultCard:"FixedDetail"}
 const module=loader(overrides)(file)
 const render=name=>{cursor=0;return all(module[name]({embedded:true}))}
 return {render,queries,setQuery:q=>query=q,setPermissions:p=>permissions=p,setParams:p=>params=new URLSearchParams(p),params:()=>params}
}
const parent="src/feature/quote/page/adminQuotes.page.tsx"
test("responsive selector fixtures use real page controls in both languages",()=>{
 if(!process.env.ADMIN_QUOTES_ARTIFACTS)return
 const React=require("react"),{renderToStaticMarkup}=require("react-dom/server")
 const target=path.resolve("artifacts/admin-quotes");fs.mkdirSync(target,{recursive:true})
 const cssFile=fs.readdirSync("dist/assets").find(file=>/^index-.*\.css$/.test(file));const css=fs.readFileSync("dist/assets/"+cssFile,"utf8").replace(/url\(([^)]*)\)/g,(_,url)=>`url(../../dist/assets/${url.replace(/^["']|["']$/g,"")})`)
 const {DateRangeFilter}=loader({"react-i18next":{useTranslation:()=>({t:key=>key})}})("src/feature/dashboard/component/dateRangeFilter.component.tsx")
 const screens=[]
 for(const language of ["es","en"]){const resources=require("../src/shared/i18n/locales/"+language+"/translation.json");const t=value=>typeof value==="string"?value.split(".").reduce((item,key)=>item?.[key],resources)??value:value
 for(const type of ["fixed","customizable"]){const h=harness(parent);h.setParams("type="+type)
 const convert=node=>{if(Array.isArray(node))return node.map(convert);if(!node||typeof node!=="object")return t(node);let elementType=node.type;const props={...node.props};if(elementType?.load){elementType="div";props.children=[DateRangeFilter({value:props.dateRange,onChange:()=>{}}),t("adminQuote.types."+type+"Title")];delete props.embedded;delete props.dateRange;delete props.onDateChange}else if(elementType==="PageContainer"){elementType="div";props.className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10";delete props.wide}else if(elementType==="Suspense"){elementType="div";delete props.fallback}if(props["aria-label"])props["aria-label"]=t(props["aria-label"]);return React.createElement(elementType,{...props,key:node.key},convert(props.children))}
 screens.push(`<section data-fixture="${language}-${type}">${renderToStaticMarkup(convert(h.render("AdminQuotesPage")[0]))}</section>`)
 }}
 fs.writeFileSync(path.join(target,"review.html"),`<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body>${screens.join("")}<script>addEventListener('load',()=>{const failures=[...document.querySelectorAll('[data-fixture]')].filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>el.dataset.fixture);const result=document.createElement('pre');result.id='layout-result';result.textContent=JSON.stringify({width:innerWidth,viewportOverflow:document.documentElement.scrollWidth>innerWidth,failures});document.body.append(result)})</script></body></html>`)
})
test("selector exposes only permitted views and mounts only the URL-selected list",()=>{
 const h=harness(parent);let tree=h.render("AdminQuotesPage");const buttons=tree.filter(n=>n.type==="button");assert.equal(buttons.length,2);assert.equal(buttons[0].props["aria-pressed"],true)
 const active=tree.find(n=>n.type?.load);assert.ok(active.type.load.toString().includes("./adminQuote.page"))
 h.setParams("search=kept");h.render("AdminQuotesPage").filter(n=>n.type==="button")[1].props.onClick();assert.equal(h.params().get("type"),"customizable");assert.equal(h.params().get("search"),"kept")
 tree=h.render("AdminQuotesPage");assert.ok(tree.find(n=>n.type?.load).type.load.toString().includes("adminCustomQuoteList.page"))
 h.setPermissions(["customQuotes:view"]);h.setParams("type=fixed");tree=h.render("AdminQuotesPage");assert.equal(tree.filter(n=>n.type==="button").length,1);assert.equal(tree.find(n=>n.type==="button").props["aria-pressed"],true)
 h.setPermissions(["quotes:view"]);h.setParams("type=customizable");assert.ok(h.render("AdminQuotesPage").find(n=>n.type?.load).type.load.toString().includes("./adminQuote.page"))
 h.setPermissions([]);assert.equal(h.render("AdminQuotesPage")[0].type,"Denied")
})
test("old custom quote list redirects to the unified customizable view",()=>{
 const h=harness(parent);h.setParams("status=pending");const node=h.render("AdminCustomQuoteListRedirect")[0];assert.equal(node.type,"Navigate");assert.equal(node.props.to,"/admin/quotes?status=pending&type=customizable");assert.equal(node.props.replace,true)
})
test("existing fixed search and inline detail retain their own data and query",()=>{
 const h=harness("src/feature/quote/page/adminQuote.page.tsx");const quote={id:1,productDisplayName:"Mango",variantLabel:"500g",quotingSalesperson:{name:"Ana",email:"ana@example.com"},createdAt:new Date(),requestedPallets:1,totalCost:20};h.setQuery({data:{data:[quote]}})
 let tree=h.render("AdminQuoteListPage");assert.equal(h.queries.at(-1).queryKey[0],"adminQuotes")
 tree.find(n=>n.type==="Input").props.onChange({target:{value:"absent"}});assert.ok(h.render("AdminQuoteListPage").some(n=>n.props.children==="adminQuote.list.noMatches"))
 h.render("AdminQuoteListPage").find(n=>n.type==="Input").props.onChange({target:{value:"Ana"}});tree=h.render("AdminQuoteListPage");tree.find(n=>n.type==="button").props.onClick();assert.equal(h.render("AdminQuoteListPage").find(n=>n.type==="FixedDetail").props.result,quote)
})
test("customizable date/status filters remain independent and preserve API inputs",()=>{
 const h=harness("src/feature/customQuote/page/adminCustomQuoteList.page.tsx");let tree=h.render("AdminCustomQuoteListPage");assert.equal(h.queries.at(-1).queryKey[0],"adminCustomQuotes")
 tree.find(n=>n.type==="DateRange").props.onChange({startDate:"2026-10-01",endDate:"2026-10-07"});h.render("AdminCustomQuoteListPage").find(n=>n.type==="Select").props.onChange({target:{value:"pending"}})
 tree=h.render("AdminCustomQuoteListPage");assert.deepEqual(h.queries.at(-1).queryFn(),{startDate:"2026-10-01",endDate:"2026-10-07",status:"pending"});assert.deepEqual(tree.find(n=>n.type==="CustomTable").props.customQuotes,[])
})
test("views keep separate loading and error states",()=>{
 for(const [file,name] of [["src/feature/quote/page/adminQuote.page.tsx","AdminQuoteListPage"],["src/feature/customQuote/page/adminCustomQuoteList.page.tsx","AdminCustomQuoteListPage"]]){const h=harness(file);h.setQuery({isLoading:true});assert.ok(h.render(name).some(n=>n.type==="Spinner"));h.setQuery({isError:true});assert.ok(h.render(name).some(n=>n.props.children==="common.loadError"))}
})
test("sidebar has one quote entry accessible with either permission and detail links remain separate",()=>{
 const nav=loader()("src/shared/layout/adminNavigation.ts");const group=nav.NAV_GROUPS.find(g=>g.id==="quotes");assert.ok(!group.items.some(i=>i.url==="/admin/custom-quotes"));assert.deepEqual(group.items.find(i=>i.url==="/admin/quotes").permission,["quotes:view","customQuotes:view"])
 const custom=fs.readFileSync("src/feature/customQuote/component/adminCustomQuoteTable.component.tsx","utf8");assert.ok(custom.includes('/admin/custom-quotes/'))
})

test("fixed date filter changes real API inputs while keeping search",()=>{
 const h=harness("src/feature/quote/page/adminQuote.page.tsx");let tree=h.render("AdminQuoteListPage");assert.ok(tree.find(n=>n.type==="DateRange"));tree.find(n=>n.type==="Input").props.onChange({target:{value:"Mango"}});tree.find(n=>n.type==="DateRange").props.onChange({startDate:"2026-10-01",endDate:"2026-10-07"});tree=h.render("AdminQuoteListPage");assert.deepEqual(h.queries.at(-1).queryFn(),{startDate:"2026-10-01",endDate:"2026-10-07"});assert.equal(tree.find(n=>n.type==="Input").props.value,"Mango");tree.find(n=>n.type==="DateRange").props.onChange({startDate:null,endDate:null});h.render("AdminQuoteListPage");assert.deepEqual(h.queries.at(-1).queryFn(),{startDate:null,endDate:null})
})
test("each tab retains its own date filter without mounting both lists",()=>{
 const h=harness(parent);let tree=h.render("AdminQuotesPage");tree.find(n=>n.type?.load).props.onDateChange({startDate:"2026-09-08",endDate:"2026-10-07"});h.render("AdminQuotesPage").filter(n=>n.type==="button")[1].props.onClick();tree=h.render("AdminQuotesPage");assert.deepEqual(tree.find(n=>n.type?.load).props.dateRange,{startDate:null,endDate:null});tree.find(n=>n.type?.load).props.onDateChange({startDate:"2026-10-01",endDate:"2026-10-07"});h.render("AdminQuotesPage").filter(n=>n.type==="button")[0].props.onClick();tree=h.render("AdminQuotesPage");assert.deepEqual(tree.find(n=>n.type?.load).props.dateRange,{startDate:"2026-09-08",endDate:"2026-10-07"});assert.equal(tree.filter(n=>n.type?.load).length,1)
})
test("shared date control uses identical 7/30/90-day presets, All time and ordered date inputs",()=>{
 const {DateRangeFilter}=loader({"react-i18next":{useTranslation:()=>({t:key=>key})},"@/shared/component/button.component":{Button:"Button"},"@/shared/component/card.component":{Card:"Card"},"@/shared/component/input.component":{Input:"Input"}})("src/feature/dashboard/component/dateRangeFilter.component.tsx");const {presetRange}=loader()("src/feature/dashboard/util/presetRange.ts");const changes=[];const nodes=all(DateRangeFilter({value:{startDate:"2026-10-01",endDate:"2026-10-07"},onChange:r=>changes.push(r)}));const buttons=nodes.filter(n=>n.type==="Button");buttons.forEach(b=>b.props.onClick());assert.deepEqual(changes,[presetRange(7),presetRange(30),presetRange(90),{startDate:null,endDate:null}]);const inputs=nodes.filter(n=>n.type==="Input");assert.equal(inputs[0].props.max,"2026-10-07");assert.equal(inputs[1].props.min,"2026-10-01");inputs[0].props.onChange({target:{value:"2026-10-02"}});assert.deepEqual(changes.at(-1),{startDate:"2026-10-02",endDate:"2026-10-07"})
})

test("fixed API sends dates to the server and omits All time null values",async()=>{
 const calls=[];const {getAllQuotesAPI}=loader({"@/shared/api/handleApiError":{handleApiError:error=>{throw error}},"@/shared/api/api":{__esModule:true,default:{get:async(...args)=>{calls.push(args);return {data:{data:[]}}}}}})("src/feature/quote/api/adminQuote.api.ts");await getAllQuotesAPI({startDate:"2026-10-01",endDate:"2026-10-07"});await getAllQuotesAPI();assert.deepEqual(calls,[["/admin/quotes",{params:{startDate:"2026-10-01",endDate:"2026-10-07"}}],["/admin/quotes",{params:{}}]])
})
