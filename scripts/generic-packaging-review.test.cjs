const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const ts = require("typescript")
test("M3 admin default route stays Dashboard and generic packaging retains its permission", () => {
 const text = fs.readFileSync("src/shared/router/AdminRoutes.tsx", "utf8")
 const file = ts.createSourceFile("AdminRoutes.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
 const declarations = file.statements.filter(ts.isVariableStatement).flatMap(s => [...s.declarationList.declarations])
 const routes = declarations.find(d => d.name.getText(file) === "routes").initializer.elements
 const fields = node => Object.fromEntries(node.properties.map(p => [p.name.getText(file), p.initializer.text]))
 assert.equal(fields(routes[0]).path, "dashboard")
 assert.equal(fields(routes.find(node => fields(node).path === "generic-packaging")).permission, "genericPackaging:view")
 assert.ok(text.includes("routes.find("), "initial destination must still respect allowed routes")
})

const path = require("node:path")
const vm = require("node:vm")
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
const formUtil = () => load("src/feature/genericPackaging/util/genericPackagingForm.ts")
const names = { group: id => `G${id}`, material: id => `M${id}`, level: level => level }

test("generic form explains every missing piece in plain language and accepts a complete configuration", () => {
 const { emptyGenericProfile, newGenericGroup, newGenericOption, genericFormProblems } = formUtil()
 assert.deepEqual(genericFormProblems(emptyGenericProfile(), names).map(p => p.key), ["displayName", "reference", "category", "presentation", "noGroups"])
 const value = { ...emptyGenericProfile(), displayName: "Bolsa 2 lb", reference: "CFG-1", categoryId: 1, presentationId: 2, bagsPerBox: 12, boxesPerPallet: 60,
  groups: [newGenericGroup("pallet"), { ...newGenericGroup("pallet"), packagingGroupId: 3, options: [newGenericOption("pallet", 7)] }, { ...newGenericGroup("pallet"), packagingGroupId: 3 }, { ...newGenericGroup("intermediate"), packagingGroupId: 4, options: [newGenericOption("intermediate")] }] }
 assert.deepEqual(genericFormProblems(value, names), [
  { key: "intermediateUnits" }, { key: "groupMissing", params: { level: "pallet" } },
  { key: "quantityMissing", params: { material: "M7" } },
  { key: "duplicateGroup", params: { group: "G3", level: "pallet" } }, { key: "groupEmpty", params: { group: "G3" } },
  { key: "materialMissing", params: { group: "G4" } },
 ])
 const complete = { ...value, unitsPerIntermediatePackage: 10, groups: [{ ...value.groups[1], options: [{ ...value.groups[1].options[0], quantityValue: 4 }] }, { ...value.groups[3], options: [newGenericOption("intermediate", 9)] }] }
 assert.deepEqual(genericFormProblems(complete, names), [])
})

test("editing keeps items deactivated in their catalog visible and explains them instead of blanking the field", () => {
 const { emptyGenericProfile, genericFormProblems, catalogAvailability, savedNames } = formUtil()
 const catalog = { categories: [{ id: 1, displayName: "Congelados", translations: [] }], presentations: [{ id: 2, displayLabel: "2 lb" }], groups: [{ id: 3, displayName: "Bolsas" }],
  materials: [{ id: 7, code: "G", displayName: "Bolsa", displayNameEn: null, packagingRole: "unit", unitCost: 1, materialType: "OTRO" }] }
 const value = { ...emptyGenericProfile(), displayName: "Bolsa 2 lb", reference: "CFG-1", categoryId: 9, presentationId: 8, bagsPerBox: 12, boxesPerPallet: 60,
  groups: [{ packagingGroupId: 4, level: "unit", selectionMode: "all", isRequired: true, options: [{ packagingId: 7, quantityBasis: "per_unit", quantityValue: 1 }] },
   { packagingGroupId: 3, level: "unit", selectionMode: "all", isRequired: true, options: [{ packagingId: 6, quantityBasis: "per_unit", quantityValue: 1 }] }] }
 assert.deepEqual(genericFormProblems(value, names, catalogAvailability(catalog)).map(p => p.key), ["categoryUnavailable", "presentationUnavailable", "groupUnavailable", "materialUnavailable"])
 assert.deepEqual(genericFormProblems({ ...value, categoryId: 1, presentationId: 2, groups: [{ ...value.groups[1], options: value.groups[0].options }] }, names, catalogAvailability(catalog)), [])
 const saved = savedNames({ ...value, id: 1, ready: false, issues: [], category: { displayName: "Secos" }, presentation: { displayLabel: "5 lb" },
  groups: [{ ...value.groups[0], group: { displayName: "Etiquetas" }, options: [{ ...value.groups[0].options[0], packaging: { displayName: "Bolsa" } }] }, { ...value.groups[1], group: { displayName: "Bolsas" }, options: [{ ...value.groups[1].options[0], packaging: { displayName: "Bolsa vieja" } }] }] })
 assert.equal(saved.category, "Secos"); assert.equal(saved.groups.get(4), "Etiquetas"); assert.equal(saved.materials.get(6), "Bolsa vieja")
 const t = (key, params = {}) => String(key.split(".").reduce((item, part) => item?.[part], resources.es)).replace(/\{\{(\w+)\}\}/g, (_, name) => params[name] ?? "")
 const { GenericGroupCard } = load("src/feature/genericPackaging/component/genericGroupCard.component.tsx", { "react-i18next": { useTranslation: () => ({ t, i18n: { language: "es" } }) } })
 const card = group => renderToStaticMarkup(React.createElement(GenericGroupCard, { group, index: 0, catalog, savedNames: saved, onChange: () => {}, onRemove: () => {}, onCreateMaterial: () => {} }))
 assert.match(card(value.groups[0]), /<option value="4" selected="">Etiquetas \(ya no disponible\)<\/option>/)
 assert.match(card(value.groups[1]), /<option value="6" selected="">Bolsa vieja \(ya no disponible\)<\/option>/)
})

test("new groups are always included and pallet materials take their catalog consumption", () => {
 const { newGenericGroup, newGenericOption, withCatalogConsumption, usesCatalogConsumption, groupUsage } = formUtil()
 assert.equal(groupUsage(newGenericGroup("pallet")), "always")
 const stretch = { id: 7, defaultQuantityBasis: "per_pallet", defaultQuantityValue: "93.30" }
 const option = withCatalogConsumption(newGenericOption("pallet", 7), "pallet", stretch)
 assert.deepEqual(option, { packagingId: 7, quantityBasis: "per_pallet", quantityValue: 93.3 })
 assert.equal(usesCatalogConsumption(option, stretch), true)
 assert.equal(usesCatalogConsumption({ ...option, quantityValue: 90 }, stretch), false)
 assert.deepEqual(withCatalogConsumption(newGenericOption("pallet", 8), "pallet", { id: 8 }), { packagingId: 8, quantityBasis: "per_pallet", quantityValue: null })
 assert.deepEqual(withCatalogConsumption(newGenericOption("unit", 7), "unit", stretch), { packagingId: 7, quantityBasis: "per_unit", quantityValue: 1 })
})

for (const language of ["es", "en"]) test(`generic group card shows catalog consumption, usage and translated controls (${language})`, () => {
 const t = (key, params = {}) => { const value = key.split(".").reduce((item, part) => item?.[part], resources[language]); assert.equal(typeof value, "string", `Missing ${language} translation: ${key}`); return value.replace(/\{\{(\w+)\}\}/g, (_, name) => params[name] ?? "") }
 const { GenericGroupCard } = load("src/feature/genericPackaging/component/genericGroupCard.component.tsx", { "react-i18next": { useTranslation: () => ({ t, i18n: { language } }) } })
 const catalog = { categories: [], presentations: [], groups: [{ id: 3, displayName: "Cajas" }], materials: [{ id: 7, code: "G", displayName: "Caja genérica", displayNameEn: null, packagingRole: "pallet", unitCost: 1, defaultQuantityBasis: "per_box", defaultQuantityValue: "1.00", materialType: "CAJA" }] }
 const html = renderToStaticMarkup(React.createElement(GenericGroupCard, { group: { packagingGroupId: 3, level: "pallet", selectionMode: "all", isRequired: true, options: [{ packagingId: 7, quantityBasis: "per_box", quantityValue: 1 }] }, index: 0, catalog, onChange: () => {}, onRemove: () => {}, onCreateMaterial: () => {} }))
 for (const text of [resources[language].genericPackaging.form.catalogConsumption, resources[language].genericPackaging.usages.always, "Caja genérica", resources[language].genericPackaging.form.createMaterial]) assert.ok(html.includes(text), text)
 assert.ok(!html.includes(resources[language].genericPackaging.usages.optionalAll))
})

test("tarima, esquinero and stretch (pallet kit types) are never offered inside a configuration", () => {
    const t = (key, params = {}) => { const value = key.split(".").reduce((item, part) => item?.[part], resources.es); return String(value ?? key).replace(/\{\{(\w+)\}\}/g, (_, name) => params[name] ?? "") }
    const { GenericGroupCard } = load("src/feature/genericPackaging/component/genericGroupCard.component.tsx", { "react-i18next": { useTranslation: () => ({ t, i18n: { language: "es" } }) } })
    const material = (id, displayName, materialType) => ({ id, code: `GEN-PAL-${id}`, displayName, displayNameEn: null, packagingRole: "pallet", unitCost: 1, defaultQuantityBasis: "per_box", defaultQuantityValue: "1.00", materialType })
    const catalog = { categories: [], presentations: [], groups: [{ id: 3, displayName: "Caja" }], materials: [material(1, "Caja genérica", "CAJA"), material(2, "Tarima genérica", "TARIMA"), material(4, "Fleje genérico", "OTRO")] }
    const html = renderToStaticMarkup(React.createElement(GenericGroupCard, { group: { packagingGroupId: 3, level: "pallet", selectionMode: "one", isRequired: true, options: [{ packagingId: 0, quantityBasis: "per_pallet", quantityValue: null }] }, index: 0, catalog, onChange: () => {}, onRemove: () => {}, onCreateMaterial: () => {} }))
    assert.ok(html.includes("Caja genérica") && html.includes("Fleje genérico"))
    assert.ok(!html.includes("Tarima genérica"))
})

test("configuration details keeps category translations through the API schema and follows the active language", () => {
 const { genericAdminOptionsSchema } = load("src/feature/genericPackaging/schema/genericPackaging.schema.ts")
 const catalog = genericAdminOptionsSchema.parse({ categories: [
  { id: 1, displayName: "Congelados", translations: [{ language: "en", displayName: "Frozen products" }] },
  { id: 2, displayName: "Sin traduccion" },
 ], presentations: [], groups: [], materials: [] })
 let language = "en-US"
 const overrides = {
  react: { ...React, useState: initial => [initial, () => {}] },
  "react-i18next": { useTranslation: () => ({ t: key => key, i18n: { resolvedLanguage: language, language } }) },
  "./genericGroupCard.component": { GenericGroupCard: "Group" },
  "./genericMaterialModal.component": { GenericMaterialModal: "Modal" },
 }
 for (const [file, name] of [["card", "Card"], ["formField", "FormField"], ["input", "Input"], ["select", "Select"], ["button", "Button"], ["checkbox", "Checkbox"]]) overrides[`@/shared/component/${file}.component`] = { [name]: name }
 const { GenericProfileForm } = load("src/feature/genericPackaging/component/genericProfileForm.component.tsx", overrides)
 const nodes = node => !node || typeof node !== "object" ? [] : [node, ...[].concat(node.props?.children ?? []).flat(Infinity).flatMap(nodes)]
 const changes = []
 const render = () => nodes(GenericProfileForm({ value: { ...formUtil().emptyGenericProfile(), categoryId: 1 }, catalog, onChange: value => changes.push(value), saving: false, editing: false })).find(node => node.props?.id === "generic-category")
 assert.equal(render().props.value, 1)
 assert.deepEqual(nodes(render()).filter(node => node.type === "option").map(node => node.props.children), ["common.selectPlaceholder", "Frozen products", "Sin traduccion"])
 language = "es"
 assert.deepEqual(nodes(render()).filter(node => node.type === "option").map(node => node.props.children), ["common.selectPlaceholder", "Congelados", "Sin traduccion"])
 assert.equal(changes.length, 0)
})
