const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { createInstance } = require('i18next')
const resources = Object.fromEntries(['es','en'].map(lang=>[lang,{translation:require(`../src/shared/i18n/locales/${lang}/translation.json`)}]))
const all=tree=>!tree||typeof tree!=='object'?[]:[tree,...[].concat(tree.props?.children??[]).flat(Infinity).flatMap(all)]
function loader(overrides={}) {
    const cache=new Map()
    function load(file){
        file=path.resolve(file)
        if(cache.has(file))return cache.get(file).exports
        const module={exports:{}};cache.set(file,module)
        const source=ts.transpileModule(fs.readFileSync(file,'utf8').replaceAll('import.meta.env.DEV','false'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText
        function localRequire(name){
            if(name in overrides)return overrides[name]
            if(name.startsWith('@/')||name.startsWith('.')){
                const base=name.startsWith('@/')?path.resolve('src',name.slice(2)):path.resolve(path.dirname(file),name)
                return load([`${base}.ts`,`${base}.tsx`].find(candidate=>fs.existsSync(candidate)))
            }
            return require(name)
        }
        vm.runInThisContext(`(function(require,module,exports){${source}\n})`,{filename:file})(localRequire,module,module.exports)
        return module.exports
    }
    return load
}
async function translator(){const instance=createInstance();await instance.init({lng:'es',fallbackLng:false,resources,interpolation:{escapeValue:false}});return instance}

test('all frontend literal translation keys and bilingual resource shapes stay available',()=>{
    const audit=require('./audit-i18n.cjs')
    assert.deepEqual(audit.parity,{es:[],en:[]})
    assert.deepEqual(audit.missing,[])
    function compare(es,en,prefix=''){
        assert.equal(typeof es,typeof en,prefix)
        if(typeof es==='object')for(const key of Object.keys(es))compare(es[key],en[key],`${prefix}.${key}`)
        else{
            const slots=value=>[...value.matchAll(/{{\s*(-?\w+)\s*}}/g)].map(match=>match[1]).sort()
            assert.deepEqual(slots(es),slots(en),prefix)
            assert.ok(es.trim()&&en.trim(),prefix)
        }
    }
    compare(resources.es.translation,resources.en.translation)
})

test('actual configured units and Juice fields/columns have labels in both languages',async()=>{
    const i18n=await translator(),load=loader()
    const {UNIT_CATALOG}=load('src/feature/unit/constant/unitCatalog.ts')
    const juice=load('src/feature/juice/constant/juiceFields.ts')
    const required=UNIT_CATALOG.map(entry=>`unit.catalog.${entry.key}`)
    for(const value of Object.values(juice)){
        if(Array.isArray(value)){
            for(const field of value)if(field.name)required.push(`juice.fields.${field.name}`)
        } else if(value&&value.path){required.push(`juice.${value.title}`);for(const field of value.fields)required.push(`juice.fields.${field.name}`);for(const column of value.columns)required.push(`juice.fields.${column}`)}
    }
    for(const lang of ['es','en'])for(const key of required)assert.ok(i18n.exists(key,{lng:lang}),`${lang}:${key}`)
})

test('PDF modal validation changes language in place without clearing the entered customer name',async()=>{
    const i18n=await translator();let slots=[],cursor=0
    const overrides={react:{useState:initial=>{const index=cursor++;if(!(index in slots))slots[index]=initial;return[slots[index],value=>{slots[index]=value}]}},'react-i18next':{useTranslation:()=>({t:i18n.getFixedT(i18n.language),i18n})},'@tanstack/react-query':{useMutation:()=>({reset(){},isPending:false})},'@react-pdf/renderer':{pdf(){}},'@/feature/quote/component/quotePdfDocument.component':{QuotePdfDocument:'Pdf'},sonner:{toast:{success(){},error(){}}}}
    for(const [name,exported] of [['button','Button'],['modal','Modal'],['input','Input'],['formField','FormField']])overrides[`@/shared/component/${name}.component`]={[exported]:exported}
    const {QuotePdfButton}=loader(overrides)('src/feature/quote/component/quotePdfButton.component.tsx')
    const render=()=>{cursor=0;return all(QuotePdfButton({lines:[{totalCost:12}]}))}
    const button=key=>render().find(node=>node.type==='Button'&&all(node).some(child=>[].concat(child.props?.children??[]).includes(i18n.t(key))))
    button('quote.pdf.button').props.onClick()
    const field=()=>render().find(node=>node.type==='FormField')
    button('quote.pdf.modal.continue').props.onClick()
    assert.equal(field().props.error,i18n.t('quote.pdf.modal.required'))
    await i18n.changeLanguage('en')
    assert.equal(field().props.error,resources.en.translation.quote.pdf.modal.required)
    render().find(node=>node.type==='Input').props.onChange({target:{value:'Cliente Los Mangos'}})
    await i18n.changeLanguage('es')
    assert.equal(render().find(node=>node.type==='Input').props.value,'Cliente Los Mangos')
})

test('select screen reader messages follow the locale and preserve literal backend option labels',async()=>{
    const i18n=await translator(),{searchableSelectMessages}=loader()('src/shared/i18n/searchableSelectMessages.ts')
    const backendName='Material de Caja Personalizado'
    for(const lang of ['es','en']){
        await i18n.changeLanguage(lang)
        const messages=searchableSelectMessages(i18n.getFixedT(lang))
        assert.equal(messages.loadingMessage(),i18n.t('common.loading'))
        assert.equal(messages.noOptionsMessage(),i18n.t('common.noOptionsFound'))
        const selected=messages.ariaLiveMessages.onChange({action:'select-option',label:backendName,isDisabled:false})
        assert.ok(selected.includes(backendName))
        assert.ok(!selected.includes('common.'))
        assert.equal(messages.screenReaderStatus({count:1}),i18n.t('common.selectA11y.results',{count:1}))
        assert.equal(messages.screenReaderStatus({count:2}),i18n.t('common.selectA11y.results',{count:2}))
    }
})

test('persistent frontend error notifications retranslate while backend errors remain literal',async()=>{
    const i18n=await translator(),shown=[]
    const load=loader({'react-i18next':{useTranslation:()=>({t:i18n.getFixedT(i18n.language),i18n})},sonner:{toast:{error:value=>shown.push(value)}}})
    const {FrontendI18nError}=load('src/shared/i18n/frontendI18nError.ts')
    const {showErrorToast}=load('src/shared/i18n/showErrorToast.tsx')
    const error=new FrontendI18nError('errors.unexpected_response',()=>i18n.t('errors.unexpected_response'))
    showErrorToast(error)
    const notification=shown[0]
    assert.equal(notification.type(notification.props).props.children,i18n.t('errors.unexpected_response'))
    await i18n.changeLanguage('en')
    assert.equal(error.message,resources.en.translation.errors.unexpected_response)
    assert.equal(notification.type(notification.props).props.children,resources.en.translation.errors.unexpected_response)
    showErrorToast(new Error('El SKU PERSISTIDO-42 ya existe'))
    assert.equal(shown[1],'El SKU PERSISTIDO-42 ya existe')
})

test('calendar labels follow the selected language without changing business dates',()=>{
    const {formatIsoDateLabel,businessIsoDate}=loader()('src/shared/format/businessDate.ts')
    const options={month:'long',day:'numeric'}
    assert.ok(formatIsoDateLabel('2026-10-07',options,'es').includes('octubre'))
    assert.ok(formatIsoDateLabel('2026-10-07',options,'en').includes('October'))
    assert.equal(businessIsoDate(new Date('2026-10-08T02:00:00Z')),'2026-10-07')
})

test('API error presentation translates frontend transport codes without matching backend message strings',async()=>{
    const i18n=await translator(),load=loader({'@/shared/i18n/i18n':{__esModule:true,default:i18n}})
    const {handleApiError}=load('src/shared/api/handleApiError.ts')
    for(const [code,key] of [['ERR_NETWORK','errors.network'],['ECONNABORTED','errors.timeout'],['ETIMEDOUT','errors.timeout']]){
        let error
        try{handleApiError({isAxiosError:true,code,message:'Network Error'})}catch(cause){error=cause}
        assert.equal(error.message,i18n.t(key))
        await i18n.changeLanguage('en')
        assert.equal(error.message,i18n.t(key))
        await i18n.changeLanguage('es')
    }
    let backendError
    try{handleApiError({isAxiosError:true,response:{data:{message:'Cliente Los Mangos: valor inválido'},status:422}})}catch(cause){backendError=cause}
    await i18n.changeLanguage('en')
    assert.equal(backendError.message,'Cliente Los Mangos: valor inválido')
})
