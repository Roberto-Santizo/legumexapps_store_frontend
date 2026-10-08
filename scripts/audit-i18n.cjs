const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const resources = Object.fromEntries(['es','en'].map(lang => [lang, JSON.parse(fs.readFileSync(`src/shared/i18n/locales/${lang}/translation.json`, 'utf8'))]))
function leaves(value, prefix = '') { return Object.entries(value).flatMap(([key, child]) => typeof child === 'object' ? leaves(child, `${prefix}${key}.`) : [`${prefix}${key}`]) }
const keys = Object.fromEntries(Object.entries(resources).map(([lang,value]) => [lang,new Set(leaves(value))]))
function hasKey(lang,key){return key.split('.').reduce((value,part)=>value?.[part],resources[lang])!==undefined||(keys[lang].has(`${key}_one`)&&keys[lang].has(`${key}_other`))}
const findings = { parity: {}, missing: [], dynamic: [], text: [], attributes: [], strings: [], files: 0 }
for(const lang of ['es','en']) findings.parity[lang] = [...keys[lang]].filter(key => !keys[lang === 'es' ? 'en' : 'es'].has(key))
function walk(dir) { for(const entry of fs.readdirSync(dir, {withFileTypes:true})) {const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(/\.tsx?$/.test(file))scan(file)} }
function scan(file) {
    findings.files++
    const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true)
    const at=node=>({file:file.replaceAll('\\','/'),line:source.getLineAndCharacterOfPosition(node.getStart(source)).line+1})
    function visit(node) {
        if(ts.isJsxText(node)&&/[a-záéíóú]/i.test(node.text.trim()))findings.text.push({...at(node),text:node.text.trim()})
        if(ts.isJsxAttribute(node)&&/^(placeholder|title|alt|aria-label|label|message|header|text)$/.test(node.name.getText(source))&&node.initializer&&ts.isStringLiteral(node.initializer)&&/[a-záéíóú]/i.test(node.initializer.text))findings.attributes.push({...at(node),name:node.name.getText(source),text:node.initializer.text})
        if(ts.isCallExpression(node)&&/^(t|i18n\.t|i18next\.t)$/.test(node.expression.getText(source))&&node.arguments[0]) {
            const arg=node.arguments[0]
            if(ts.isStringLiteralLike(arg)) {if(!hasKey('es',arg.text)||!hasKey('en',arg.text))findings.missing.push({...at(node),key:arg.text})}
            else findings.dynamic.push({...at(node),expression:arg.getText(source)})
        }
        if(ts.isStringLiteralLike(node)&&/[A-Za-zÁÉÍÓÚáéíóú]/.test(node.text)&&!ts.isImportDeclaration(node.parent)&&!ts.isImportSpecifier(node.parent)&&!ts.isExportDeclaration(node.parent)){
            findings.strings.push({...at(node),text:node.text,parent:ts.SyntaxKind[node.parent.kind]})
            if(/^[a-zA-Z]+\.[a-zA-Z]/.test(node.text)&&node.text.split('.')[0] in resources.es&&(!hasKey('es',node.text)||!hasKey('en',node.text)))findings.missing.push({...at(node),key:node.text})
        }
        ts.forEachChild(node,visit)
    }
    visit(source)
}
walk('src')
module.exports=findings
if(require.main===module){
    fs.mkdirSync('artifacts/i18n',{recursive:true})
    fs.writeFileSync('artifacts/i18n/audit.json',JSON.stringify(findings,null,2))
    console.log(JSON.stringify({files:findings.files,parity:findings.parity,missing:findings.missing,text:findings.text,attributes:findings.attributes},null,2))
}
