const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")

function loader(overrides) {
    const cache = new Map()
    return function load(file) {
        file = path.resolve(file)
        if (cache.has(file)) return cache.get(file).exports
        const module = { exports: {} }; cache.set(file, module)
        const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: {
            module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
        } }).outputText
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
}
const all = tree => !tree || typeof tree !== "object" ? [] : [tree, ...[].concat(tree.props?.children ?? []).flat(Infinity).flatMap(all)]

function harness({ permissions = ["salespeople:view", "salespeople:edit", "clients:view"], status = "success", pending = false } = {}) {
    const slots = [], mutations = [], calls = [], cacheWrites = [], messages = []
    let cursor = 0
    let assignedRows = [{ id: 1, name: "Assigned", isActive: true }, { id: 4, name: "Inactive", isActive: false }]
    const candidates = [...assignedRows, { id: 2, name: "Café", isActive: true }, { id: 3, name: "Other", isActive: true }, { id: 5, name: "Disabled", isActive: false }]
    const dictionary = require("../src/shared/i18n/locales/es/translation.json")
    const t = (key, values = {}) => {
        const value = key.split(".").reduce((value, key) => value?.[key], dictionary)
        assert.equal(typeof value, "string", `Missing translation ${key}`)
        return value.replace(/{{(\w+)}}/g, (_, key) => String(values[key]))
    }
    const api = {
        getRepresentativeClientsAPI: async id => { calls.push(["get", id]); return { data: assignedRows } },
        assignRepresentativeClientsAPI: async (id, ids) => { calls.push(["assign", id, ids]); return { data: candidates.filter(client => assignedRows.some(row => row.id === client.id) || ids.includes(client.id)), message: "Saved" } },
        assignAllRepresentativeClientsAPI: async id => { calls.push(["assignAll",id]);return {data:candidates.filter(client=>client.isActive||assignedRows.some(row=>row.id===client.id)),message:'Saved'} },
        removeRepresentativeClientAPI: async (id, clientId) => { calls.push(["remove", id, clientId]); return { data: assignedRows.filter(client => client.id !== clientId), message: "Saved" } },
    }
    const load = loader({
        react: { useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = value }] } },
        "react-i18next": { useTranslation: () => ({ t }) },
        "@/shared/auth/usePermission": { usePermission: () => ({ hasPermission: key => permissions.includes(key) }) },
        "@/shared/component/card.component": { Card: "Card" },
        "@/shared/component/input.component": { Input: "Input" },
        "@/shared/component/button.component": { Button: "Button" },
        "@/shared/i18n/showErrorToast": { showErrorToast: error => messages.push(error.message) },
        sonner: { toast: { success: message => messages.push(message) } },
        "@/feature/client/api/client.api": { getClientsAPI: async () => ({ data: candidates }) },
        "../api/representativeClient.api": api,
        "@tanstack/react-query": {
            useQuery: options => ({ data: status === "success" ? { data: options.queryKey[0] === "clients" ? candidates : assignedRows } : undefined,
                isPending: status === "pending", isSuccess: status === "success", isError: status === "error", refetch: () => calls.push(["refetch"]) }),
            useQueryClient: () => ({ setQueryData: (key, data) => { cacheWrites.push([key, data]); assignedRows = data.data }, invalidateQueries: options => calls.push(["invalidate", options]) }),
            useMutation: options => { const index = mutations.length; mutations.push(options); return { isPending: pending, mutate: value => calls.push(["mutate", index, value]) } },
        },
    })
    const { RepresentativeClients, InitialClientsPicker } = load("src/feature/salesperson/component/representativeClients.component.tsx")
    const render = () => {
        cursor = 0; mutations.length = 0
        const element = RepresentativeClients({ salespersonId: 7 })
        return element ? all(element.type(element.props)) : []
    }
    const renderPicker = (value, onChange) => { cursor = 0; return all(InitialClientsPicker({ value, onChange, disabled: false })) }
    return { render, renderPicker, mutations, calls, cacheWrites, messages, slots }
}

test("assignment UI requires both read permissions and hides controls from read-only staff", () => {
    assert.deepEqual(harness({ permissions: ["salespeople:edit"] }).render(), [])
    assert.deepEqual(harness({ permissions: ["salespeople:view"] }).render(), [])
    const nodes = harness({ permissions: ["salespeople:view", "clients:view"] }).render()
    assert.equal(nodes.filter(node => node.type === "li").length, 2)
    assert.equal(nodes.filter(node => node.type === "Button").length, 0)
})
test("search normalizes accents, selects multiple active unassigned clients and sends only selected IDs", () => {
    const h = harness()
    let nodes = h.render()
    assert.equal(nodes.filter(node => node.type === "input").length, 2)
    nodes.find(node => node.type === "Input").props.onChange({ target: { value: "CAFE" } })
    nodes = h.render()
    assert.equal(nodes.filter(node => node.type === "input").length, 1)
    nodes.find(node => node.type === "input").props.onChange({ target: { checked: true } })
    h.render().find(node => node.type === "Input").props.onChange({ target: { value: "" } })
    nodes = h.render()
    nodes.filter(node => node.type === "input")[1].props.onChange({ target: { checked: true } })
    nodes = h.render()
    const assign = nodes.find(node => node.type === "Button" && node.props.children === "Asignar seleccionados")
    assert.equal(assign.props.disabled, false)
    assign.props.onClick()
    assert.deepEqual(h.calls.at(-1), ["mutate", 0, [2, 3]])
})
test("successful writes update scoped query data; removal targets the selected pair", async () => {
    const h = harness()
    let nodes = h.render()
    nodes.find(node => node.type === "Button" && node.props["aria-label"] === "Quitar la asignación de Inactive").props.onClick()
    assert.deepEqual(h.calls.at(-1), ["mutate", 1, 4])
    const response = await h.mutations[1].mutationFn(4)
    h.mutations[1].onSuccess(response)
    assert.deepEqual(h.cacheWrites[0][0], ["representativeClients", 7])
    assert.deepEqual(h.messages, ["Saved"])
    nodes = h.render()
    assert.equal(nodes.filter(node => node.type === "li").length, 1)
})

test("assign all is independent of search, targets only the edited representative and clears manual selections",async()=>{
    const h=harness()
    let nodes=h.render()
    nodes.find(node=>node.type==='input').props.onChange({target:{checked:true}})
    nodes.find(node=>node.type==='Input').props.onChange({target:{value:'no match'}})
    nodes=h.render()
    assert.equal(nodes.filter(node=>node.type==='input').length,0)
    const button=nodes.find(node=>node.type==='Button'&&node.props.children==='Asignar todos los clientes activos')
    assert.equal(button.props.disabled,false)
    button.props.onClick()
    assert.deepEqual(h.calls.at(-1),['mutate',2,undefined])
    h.mutations[2].onSuccess(await h.mutations[2].mutationFn())
    assert.ok(h.calls.some(call=>call[0]==='assignAll'&&call[1]===7))
    assert.equal(h.slots[1].length,0)
    nodes=h.render()
    assert.equal(nodes.filter(node=>node.type==='li').length,4)
    assert.equal(nodes.find(node=>node.type==='Button'&&node.props.children==='Asignar todos los clientes activos').props.disabled,true)
})
test("loading, errors, empty selection and in-flight writes block unsafe actions", () => {
    assert.ok(harness({ status: "pending" }).render().some(node => node.props.role === "status"))
    const error = harness({ status: "error" })
    const nodes = error.render()
    assert.ok(nodes.some(node => node.props.role === "alert"))
    nodes.find(node => node.type === "Button").props.onClick()
    assert.equal(error.calls.filter(call => call[0] === "refetch").length, 2)
    assert.ok(harness({ pending: true }).render().filter(node => node.type === "Button").every(node => node.props.disabled))
    assert.equal(harness().render().find(node => node.type === "Button" && node.props.children === "Asignar seleccionados").props.disabled, true)
})
test("assignment API uses staff endpoints, validates responses and forwards errors", async () => {
    const calls = []
    const api = Object.fromEntries(["get", "put", "delete"].map(method => [method, async (...args) => { calls.push([method, ...args]); return { data: { data: [{ id: 1, name: "Client", isActive: true }], message: "Saved" } } }]))
    const module = loader({ "@/shared/api/api": { __esModule: true, default: api }, "@/shared/api/handleApiError": { handleApiError: error => { throw error } } })("src/feature/salesperson/api/representativeClient.api.ts")
    await module.getRepresentativeClientsAPI(7)
    await module.assignRepresentativeClientsAPI(7, [1, 2])
    await module.removeRepresentativeClientAPI(7, 1)
    await module.assignAllRepresentativeClientsAPI(7)
    assert.deepEqual(calls, [["get", "/salespeople/7/clients"], ["put", "/salespeople/7/clients", { clientIds: [1, 2] }], ["delete", "/salespeople/7/clients/1"],['put','/salespeople/7/clients/all']])
    api.get = async () => { throw new Error("Forbidden") }
    await assert.rejects(module.getRepresentativeClientsAPI(7), /Forbidden/)
})
test("assignment translations have matching keys and interpolation in both languages", () => {
    const es = require("../src/shared/i18n/locales/es/translation.json").representativeClients
    const en = require("../src/shared/i18n/locales/en/translation.json").representativeClients
    assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort())
    for (const key of Object.keys(es)) {
        assert.ok(es[key].length && en[key].length)
        assert.deepEqual(es[key].match(/{{\w+}}/g), en[key].match(/{{\w+}}/g))
    }
})

test("creation picker offers only active clients and reports a manual selection or assign-all", () => {
    assert.deepEqual(harness({ permissions: ["salespeople:create"] }).renderPicker({ clientIds: [], assignAll: false }, () => {}), [])
    const h = harness({ permissions: ["salespeople:create", "clients:view"] })
    const changes = []
    let nodes = h.renderPicker({ clientIds: [], assignAll: false }, value => changes.push(value))
    const names = nodes.filter(node => node.type === "span" && node.props.className === "min-w-0 break-words").map(node => node.props.children)
    assert.deepEqual(names, ["Assigned", "Café", "Other"])
    const checkboxes = nodes.filter(node => node.type === "input")
    assert.equal(checkboxes.length, 4)
    checkboxes[2].props.onChange({ target: { checked: true } })
    assert.deepEqual(changes.at(-1), { clientIds: [2], assignAll: false })
    checkboxes[0].props.onChange({ target: { checked: true } })
    assert.deepEqual(changes.at(-1), { clientIds: [], assignAll: true })
    nodes = h.renderPicker({ clientIds: [], assignAll: true }, () => {})
    assert.equal(nodes.filter(node => node.type === "input").length, 1)
    assert.equal(nodes.some(node => node.type === "Input"), false)
})
