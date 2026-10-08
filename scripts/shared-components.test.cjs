const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")

// Same technique as the other script tests: transpile the real module, replace hooks/leaf components by
// name and inspect the returned element tree.
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
        vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(localRequire, module, module.exports)
        return module.exports
    }
    return load
}

const all = tree => !tree || typeof tree !== "object" ? [] : [tree, ...[].concat(tree.props?.children ?? []).flat(Infinity).flatMap(all)]
const t = (key, options) => options ? `${key}${JSON.stringify(options)}` : key
const i18n = { "react-i18next": { useTranslation: () => ({ t }) } }

function stateHarness() {
    const slots = []
    let cursor = 0
    return {
        begin() { cursor = 0 },
        useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial; return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value }] },
    }
}

test("catalog creatable select opens the create modal with the typed name and selects what it creates", () => {
    const state = stateHarness()
    const { CatalogCreatableSelect } = loader({ ...i18n, react: { useState: state.useState }, "@/shared/component/creatableSearchableSelect.component": { CreatableSearchableSelect: "CreatableSearchableSelect" } })("src/shared/component/catalogCreatableSelect.component.tsx")
    const changes = []
    const options = [{ value: 1, label: "Bolsa" }, { value: 2, label: "Caja" }]
    const render = () => { state.begin(); return all(CatalogCreatableSelect({ inputId: "x", value: 2, onChange: value => changes.push(value), options, renderCreateModal: props => ({ type: "Modal", props }) })) }
    let select = render().find(node => node.type === "CreatableSearchableSelect")
    assert.deepEqual(select.props.value, options[1])
    assert.equal(select.props.isClearable, true)
    assert.equal(render().find(node => node.type === "Modal"), undefined)
    select.props.onChange(null)
    select.props.onChange(options[0])
    assert.deepEqual(changes, [undefined, 1])
    select.props.onCreateOption("Etiqueta")
    const modal = render().find(node => node.type === "Modal")
    assert.equal(modal.props.initialDisplayName, "Etiqueta")
    modal.props.onCreated({ id: 9 })
    assert.deepEqual(changes, [undefined, 1, 9])
    assert.equal(render().find(node => node.type === "Modal"), undefined)
    select = render().find(node => node.type === "CreatableSearchableSelect")
    select.props.onCreateOption("Otro")
    render().find(node => node.type === "Modal").props.onClose()
    assert.equal(render().find(node => node.type === "Modal"), undefined)
    assert.deepEqual(changes, [undefined, 1, 9])
})

function loginHarness({ error = null, isPending = false, from } = {}) {
    let mutationOptions
    const navigations = [], toasts = [], registered = []
    const overrides = {
        ...i18n,
        "react-hook-form": { useForm: () => ({ register: name => { registered.push(name); return { name } }, handleSubmit: fn => fn, formState: { errors: { email: { type: "too_small" } } } }) },
        "@hookform/resolvers/zod": { zodResolver: () => () => ({}) },
        "@tanstack/react-query": { useMutation: options => { mutationOptions = options; return { error, isPending, mutate() {} } } },
        "react-router-dom": { useNavigate: () => (to, options) => navigations.push([to, options]), useLocation: () => ({ state: from ? { from: { pathname: from } } : null }) },
        sonner: { toast: { error: message => toasts.push(message) } },
        "@/shared/component/authCard.component": { AuthCard: "AuthCard" },
        "@/shared/component/formField.component": { FormField: "FormField" },
        "@/shared/component/input.component": { Input: "Input" },
        "@/shared/component/passwordInput.component": { PasswordInput: "PasswordInput" },
    }
    const { CredentialLoginPage } = loader(overrides)("src/shared/auth/credentialLoginPage.component.tsx")
    const sessions = []
    const tree = CredentialLoginPage({
        i18nPrefix: "auth.salespersonLogin", schema: {}, defaultValues: { email: "", password: "" }, loginAPI() {},
        isApiError: value => value instanceof Error && "status" in value, onLogin: session => sessions.push(session), fallbackPath: "/solicitud",
        identifier: { name: "email", type: "email", icon: "MailIcon" },
    })
    return { nodes: all(tree), card: tree, mutationOptions, navigations, toasts, sessions, registered }
}

test("credential login keeps fields, labels and translated keys per login", () => {
    const h = loginHarness()
    assert.deepEqual([h.card.props.title, h.card.props.submitLabel, h.card.props.lockedMessage], ["auth.salespersonLogin.title", "auth.salespersonLogin.submit", undefined])
    const identifier = h.nodes.find(node => node.type === "Input").props
    assert.deepEqual([identifier.id, identifier.type, identifier.autoComplete, identifier.placeholder, identifier.preserveCase, identifier.hasError], ["email", "email", "email", "auth.salespersonLogin.emailPlaceholder", undefined, true])
    const fields = h.nodes.filter(node => node.type === "FormField").map(node => [node.props.label, node.props.htmlFor, node.props.required])
    assert.deepEqual(fields, [["auth.salespersonLogin.email", "email", true], ["auth.salespersonLogin.password", "password", true]])
    assert.ok(h.nodes.some(node => node.type === "MailIcon"))
    assert.deepEqual(h.registered, ["email", "password"])
    assert.equal(h.nodes.find(node => node.type === "PasswordInput").props.showPasswordLabel, "auth.salespersonLogin.showPassword")
})

test("credential login stores the session, returns to the protected page and shows only the locked error banner", () => {
    const fresh = loginHarness()
    fresh.mutationOptions.onSuccess({ data: { token: "x" } })
    assert.deepEqual(fresh.sessions, [{ token: "x" }])
    assert.deepEqual(fresh.navigations, [["/solicitud", { replace: true }]])
    const redirected = loginHarness({ from: "/solicitud/a-la-medida" })
    redirected.mutationOptions.onSuccess({ data: {} })
    assert.deepEqual(redirected.navigations, [["/solicitud/a-la-medida", { replace: true }]])
    redirected.mutationOptions.onError(new Error("Credenciales inválidas"))
    assert.deepEqual(redirected.toasts, ["Credenciales inválidas"])
    const locked = Object.assign(new Error("Cuenta bloqueada"), { status: 423 })
    assert.equal(loginHarness({ error: locked }).card.props.lockedMessage, "Cuenta bloqueada")
    assert.equal(loginHarness({ error: Object.assign(new Error("No"), { status: 401 }) }).card.props.lockedMessage, undefined)
})

test("quote order: results, steps, new quote and clearing the order", () => {
    const state = stateHarness()
    const { useQuoteOrder } = loader({ react: { useState: state.useState } })("src/feature/quote/component/useQuoteOrder.ts")
    let rotations = 0
    const useOrderRender = () => { state.begin(); return useQuoteOrder(() => { rotations++ }) }
    const order = useOrderRender
    assert.deepEqual([order().wizardStep, order().currentResult, order().quotedLines, order().formResetKey], ["mode", null, [], 0])
    order().addQuotedLine({ id: 1 })
    order().addQuotedLine({ id: 2 })
    assert.deepEqual([order().currentResult, order().quotedLines], [{ id: 2 }, [{ id: 1 }, { id: 2 }]])
    order().handleStepChange("total")
    assert.deepEqual([order().wizardStep, order().currentResult], ["total", { id: 2 }])
    order().handleStepChange("pallets")
    assert.deepEqual([order().wizardStep, order().currentResult], ["pallets", null])
    order().addQuotedLine({ id: 3 })
    order().handleQuoteAnother()
    assert.deepEqual([order().wizardStep, order().currentResult, order().quotedLines.length, order().formResetKey, rotations], ["mode", null, 3, 1, 1])
    order().handleClearOrder()
    assert.deepEqual([order().quotedLines, order().formResetKey, rotations], [[], 2, 2])
})

test("quote wizard content keeps the form as the first child of the same root on every step", () => {
    const { QuoteWizardContent } = loader({ ...i18n, "@/shared/component/spinner.component": { Spinner: "Spinner" } })("src/feature/quote/component/quoteWizardContent.component.tsx")
    const { WIZARD_DETAILS_LAYOUT_CLASSNAME, WIZARD_STEP_LAYOUT_CLASSNAME } = loader()("src/feature/quote/component/quoteWizardLayout.ts")
    const props = { isLoadingCatalog: false, hasCatalogError: false, form: { type: "Form", props: {} }, result: { type: "Result", props: {} }, orderSummary: { type: "Summary", props: {} } }
    const total = QuoteWizardContent({ ...props, wizardStep: "total" })
    const pallets = QuoteWizardContent({ ...props, wizardStep: "pallets" })
    assert.equal(total.type, "div"); assert.equal(pallets.type, "div")
    assert.equal(total.props.className, WIZARD_DETAILS_LAYOUT_CLASSNAME)
    assert.equal(pallets.props.className, WIZARD_STEP_LAYOUT_CLASSNAME)
    assert.equal(total.props.children[0].type, "Form")
    assert.equal(pallets.props.children[0].type, "Form")
    assert.deepEqual(total.props.children[1].props.children.map(child => child.type), ["Result", "Summary"])
    assert.equal(pallets.props.children[1].type, "Summary")
    assert.ok(!all(pallets).some(node => node.type === "Result"))
    assert.equal(QuoteWizardContent({ ...props, wizardStep: "pallets", orderSummary: false }).props.children[1], false)
    assert.equal(QuoteWizardContent({ ...props, wizardStep: "total", isLoadingCatalog: true }).type, "Spinner")
    const error = QuoteWizardContent({ ...props, wizardStep: "total", hasCatalogError: true })
    assert.deepEqual([error.type, error.props.children], ["p", "common.loadError"])
})
