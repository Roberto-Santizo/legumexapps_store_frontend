const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")

function load(file, overrides = {}) {
    const module = { exports: {} }
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    vm.runInThisContext(`(function(require,module,exports){${source}\n})`)(name => Object.hasOwn(overrides, name) ? overrides[name] : require(name), module, module.exports)
    return module.exports
}
const policy = load("src/shared/theme/representativeTheme.ts")

test("representative dark preference applies only to authenticated quote routes using existing admin colors", () => {
    const storage = { getItem: () => "dark" }
    for (const pathname of ["/solicitud", "/solicitud/a-la-medida"]) {
        assert.equal(policy.resolveRouteTheme(pathname, "dark", storage, true), "dark")
        assert.equal(policy.resolveRouteTheme(pathname, "light", storage, true), "light")
        assert.equal(policy.resolveRouteTheme(pathname, "dark", storage, false), "light")
    }
    for (const pathname of ["/", "/iniciar-sesion", "/catalogo", "/contacto", "/solicitud-ajena", "/iniciar-sesion-ajena"]) {
        assert.equal(policy.resolveRouteTheme(pathname, "dark", storage, true), "light")
    }
    assert.equal(policy.resolveRouteTheme("/admin/products", "light", storage), "dark")
    assert.equal(policy.resolveRouteTheme("/admin/login", "dark", { getItem: () => "light" }), "light")
    assert.equal(policy.readTheme({ getItem: () => "invalid" }, policy.REPRESENTATIVE_THEME_KEY), "light")
    assert.equal(policy.readTheme({ getItem: () => { throw Error("unavailable") } }, policy.REPRESENTATIVE_THEME_KEY), "light")
})

test("route transitions restore public light mode without overwriting either saved preference", () => {
    const previousWindow = globalThis.window, previousDocument = globalThis.document
    const values = new Map([[policy.REPRESENTATIVE_THEME_KEY, "dark"], ["legumex.theme", "light"]])
    const classes = new Set(); const root = { dataset: {}, classList: { toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name) } }
    globalThis.document = { documentElement: root }
    globalThis.window = { localStorage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) } }
    let pathname = "/iniciar-sesion", state, cleanup, authenticated = false
    const Provider = load("src/shared/theme/RepresentativeThemeProvider.tsx", {
        react: {
            createContext: () => ({ Provider: "Provider" }),
            useState: initial => { if (state === undefined) state = initial(); return [state, value => { state = value }] },
            useLayoutEffect: callback => { cleanup?.(); cleanup = callback() },
        },
        "react-router-dom": { useLocation: () => ({ pathname }) },
        "./representativeTheme": policy,
        "./representativeThemeContext": { RepresentativeThemeContext: { Provider: "Provider" } },
        "@/shared/auth/salesperson/useSalespersonAuth": { useSalespersonAuth: () => ({ salesperson: authenticated ? { id: 42 } : null }) },
    }).RepresentativeThemeProvider
    const render = () => Provider({ children: "App" })
    try {
        render(); assert.equal(classes.has("dark"), false)
        authenticated = true; pathname = "/solicitud"; render(); assert.equal(root.dataset.theme, "dark")
        pathname = "/solicitud/a-la-medida"; render(); assert.equal(root.dataset.theme, "dark")
        pathname = "/"; render(); assert.equal(root.dataset.theme, "light"); assert.equal(classes.has("dark"), false)
        assert.equal(values.get(policy.REPRESENTATIVE_THEME_KEY), "dark")
        pathname = "/admin/login"; render(); assert.equal(root.dataset.theme, "light")
        pathname = "/solicitud"; render().props.value.toggle(); render()
        assert.equal(root.dataset.theme, "light"); assert.equal(values.get(policy.REPRESENTATIVE_THEME_KEY), "light")
        assert.equal(values.get("legumex.theme"), "light")
        render().props.value.toggle(); render(); assert.equal(root.dataset.theme, "dark")
        authenticated = false; render(); assert.equal(root.dataset.theme, "light")
        cleanup(); assert.equal(root.dataset.theme, "light")
    } finally { globalThis.window = previousWindow; globalThis.document = previousDocument }
})
