const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")
const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")
const { createInstance } = require("i18next")

function load(file, overrides = {}) {
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
    const module = { exports: {} }
    vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(name => name in overrides ? overrides[name] : require(name), module, module.exports)
    return module.exports
}

test("retired prospect and landing image panels, routes and translations are removed while quote access remains", () => {
    const { NAV_GROUPS } = load("src/shared/layout/adminNavigation.ts")
    const items = NAV_GROUPS.flatMap(group => group.items)
    assert.ok(!items.some(item => item.url.includes("leads") || [].concat(item.permission).some(permission => permission.startsWith("leads:"))))
    for (const route of ["/admin/clients", "/admin/salespeople"]) assert.ok(items.some(item => item.url === route))
    assert.doesNotMatch(fs.readFileSync("src/shared/router/AdminRoutes.tsx", "utf8"), /feature\/lead\/|permission: "leads:/)
    assert.ok(!items.some(item => item.url.includes("site-images") || [].concat(item.permission).includes("siteContent:edit")))
    assert.doesNotMatch(fs.readFileSync("src/shared/router/AdminRoutes.tsx", "utf8"), /feature\/siteImage\/|path: "site-images"|siteContent:edit/)
    for (const file of ["src/feature/lead/api/lead.api.ts", "src/feature/home/component/leadCaptureForm.component.tsx", "src/feature/home/schema/leadCapture.schema.ts"]) assert.equal(fs.existsSync(file), false)
    for (const file of ["src/feature/siteImage/api/siteImage.api.ts", "src/feature/siteImage/page/siteImage.page.tsx", "src/feature/siteImage/hook/useSiteImages.ts"]) assert.equal(fs.existsSync(file), false)
    for (const lang of ["es", "en"]) {
        const messages = JSON.parse(fs.readFileSync(path.join("src/shared/i18n/locales", lang, "translation.json"), "utf8"))
        assert.equal(messages.lead, undefined)
        assert.equal(messages.siteImage, undefined)
        assert.equal(messages.home, undefined)
        assert.ok(messages.access)
    }
})

for (const lang of ["es", "en"]) test(`the access home page offers only the representative and administrator sign-ins (${lang})`, async () => {
    const messages = JSON.parse(fs.readFileSync(path.join("src/shared/i18n/locales", lang, "translation.json"), "utf8"))
    const i18n = createInstance()
    await i18n.init({ lng: lang, resources: { [lang]: { translation: messages } } })
    const { LegumexLogoStacked } = load("src/shared/component/legumexLogoStacked.component.tsx", {
        "react-i18next": { useTranslation: () => ({ t: i18n.t.bind(i18n) }) },
    })
    const { HomePage } = load("src/feature/home/page/home.page.tsx", {
        "lucide-react": { ArrowUpRight: "span", BriefcaseBusiness: "span", ChartNoAxesCombined: "span" },
        "motion/react": { motion: { main: ({ children, ...props }) => React.createElement("main", props, children), div: ({ children, ...props }) => React.createElement("div", props, children) }, useReducedMotion: () => false },
        "react-i18next": { useTranslation: () => ({ t: i18n.t.bind(i18n) }) },
        "react-router-dom": { Link: ({ children, to, ...props }) => React.createElement("a", { href: to, ...props }, children) },
        "@/shared/component/legumexLogoStacked.component": { LegumexLogoStacked },
        "@/shared/layout/LanguageSwitch": { LanguageSwitch: "language-switch" },
    })
    const html = renderToStaticMarkup(React.createElement(HomePage))
    assert.match(html, /legumex-stacked-logo-mark/)
    assert.match(html, /legumex-stacked-logo--header/)
    assert.match(html, /Growing Quality\. Delivering Trust\./)
    assert.doesNotMatch(html, /<img\b/)
    const sidebarLogo = renderToStaticMarkup(React.createElement(LegumexLogoStacked))
    assert.match(sidebarLogo, /legumex-stacked-logo--sidebar/)
    assert.match(sidebarLogo, /Growing Quality\. Delivering Trust\./)
    assert.ok(html.includes('href="/iniciar-sesion"'))
    assert.ok(html.includes('href="/admin"'))
    assert.ok(html.includes(i18n.t("access.representative.title")))
    assert.ok(html.includes(i18n.t("access.administrator.title")))
    assert.ok(html.includes("group-hover:-translate-y-1"))
    assert.ok(html.includes("bg-brand-300/30"))
    assert.ok(html.includes("language-switch"))
    assert.doesNotMatch(html, /hero-section|product-lines|leadCapture|leads:|<form\b|<input\b/)
})
