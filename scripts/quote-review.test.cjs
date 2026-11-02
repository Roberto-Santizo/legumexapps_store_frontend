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
        vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(localRequire, module, module.exports)
        return module.exports
    }
    return load
}

const load = loader({ "@/feature/destination/schema/destination.schema": { responseDestinationSchema: require("zod").z.object({}) } })
const orderId = "3ef2ae08-39bd-47ba-b3d1-d8b433159c03"

// Línea guardada tal como la devuelve el detalle del backend (Quote.toJSON(): DECIMAL como string).
function savedLine(overrides = {}) {
    return {
        kind: "fixed", id: 7, productDisplayName: "PIÑA DESHIDRATADA", variantLabel: "BOLSA 1 LB", destinationId: null,
        requestedPallets: 2, totalUnits: 1200, rawMaterialCost: "100.0000", unitPackagingCost: "10", intermediatePackagingCost: "0",
        palletMaterialCost: "5", transportCost: "0", totalCost: "115.0000",
        breakdown: { order: { id: orderId, clientName: "MIAMI AGRO" }, rawMaterials: [], palletMaterials: [], transport: { destinationId: null, displayName: "", baseCost: 0 } },
        ...overrides,
    }
}

test("profit per pound accepts 0 to 5 USD with at most four decimals, as the backend does", () => {
    const { isValidProfitPerPound, MAX_PROFIT_PER_POUND } = load("src/feature/quote/util/profitPerPound.ts")
    assert.equal(MAX_PROFIT_PER_POUND, 5)
    for (const value of ["0", "0.25", "1.2345", "5", "5.0000"]) assert.equal(isValidProfitPerPound(value), true, value)
    for (const value of ["", "-1", "25", "5.0001", "0.12345", "1,5", "abc", ".5", "1e2"]) assert.equal(isValidProfitPerPound(value), false, value)
})

test("review detail and list parse the backend payload, including DECIMAL strings", () => {
    const { quoteReviewDetailSchema, quoteReviewSchema } = load("src/feature/quoteReview/schema/quoteReview.schema.ts")
    const review = {
        id: 1, orderId, salespersonId: 4, clientId: 9, clientName: "MIAMI AGRO", clientEmail: "compras@miami.com", deliveryStatus: "sent", deliveryRecipients: "representative_and_client", rejectionReason: null, status: "approved", linesDigest: "a".repeat(64),
        profitPerPound: "0.2500", reviewedByUserId: 1, reviewedAt: "2026-10-28T18:00:00.000Z", notificationStatus: "sent",
        notificationAttempts: 1, notifiedAt: null, createdAt: "2026-10-28T17:00:00.000Z", updatedAt: "2026-10-28T18:00:00.000Z",
        pricing: { profitPerPound: 0.25, netPounds: 100, totalCost: 115, profitTotal: 25, finalPrice: 140, lines: [{ kind: "fixed", quoteId: 7, productDisplayName: "PIÑA", totalCost: 115, netPounds: 100, profitPerPound: 0.25, profitTotal: 25, finalPrice: 140 }] },
        submittingSalesperson: { id: 4, name: "LUIS" }, reviewingUser: { id: 1, name: "ADMIN" },
    }
    const parsed = quoteReviewSchema.parse(review)
    assert.equal(parsed.profitPerPound, 0.25)
    assert.ok(parsed.createdAt instanceof Date)
    // El detalle (sin includes en la respuesta de aprobar) y una revisión pendiente sin ganancia.
    const pending = quoteReviewSchema.parse({ ...review, status: "pending", profitPerPound: null, pricing: null, reviewedAt: null, submittingSalesperson: undefined, reviewingUser: undefined })
    assert.equal(pending.pricing, null)
    const detail = quoteReviewDetailSchema.parse({ review, lines: [savedLine()], linesDigest: "b".repeat(64), deliveryAvailable: false, suggestedClientEmail: "compras@miami.com" })
    assert.equal(detail.lines[0].productDisplayName, "PIÑA DESHIDRATADA")
    // Rechazada: sin ganancia, con su motivo y sin envío; la respuesta de rechazar dice si se avisó al representante.
    const rejected = quoteReviewDetailSchema.parse({ review: { ...review, status: "rejected", rejectionReason: "Sin producto", profitPerPound: null, pricing: null, deliveryStatus: "pending", deliveryRecipients: null }, lines: [], linesDigest: "b".repeat(64), deliveryAvailable: false, suggestedClientEmail: null, representativeNotified: false })
    assert.equal(rejected.review.rejectionReason, "Sin producto")
    assert.equal(rejected.representativeNotified, false)
    assert.throws(() => quoteReviewSchema.parse({ ...review, status: "lost" }))
})

test("review lines keep the saved cost breakdown and pair the profit by table and id", () => {
    const { quoteReviewLines } = load("src/feature/quoteReview/util/quoteReviewLines.ts")
    const profit = { kind: "fixed", quoteId: 7, productDisplayName: "PIÑA", totalCost: 115, netPounds: 100, profitPerPound: 0.25, profitTotal: 25, finalPrice: 140 }
    // Misma id en la otra tabla: nunca recibe la ganancia de la línea fija.
    const lines = quoteReviewLines([savedLine(), savedLine({ kind: "customizable", variantLabel: undefined, destinationId: undefined })], { profitPerPound: 0.25, netPounds: 100, totalCost: 115, profitTotal: 25, finalPrice: 140, lines: [profit] })
    assert.equal(lines[0].line.totalCost, 115)
    assert.deepEqual(lines[0].profit, profit)
    assert.equal(lines[1].line.variantLabel, null)
    assert.equal(lines[1].profit, null)
    // Sin ganancia todavía (pendiente sin calcular) y un registro ilegible: sin montos inventados.
    const [unpriced, unreadable] = quoteReviewLines([savedLine(), savedLine({ id: 8, breakdown: null })], null)
    assert.equal(unpriced.profit, null)
    assert.equal(unreadable.line, null)
    assert.equal(unreadable.productDisplayName, "PIÑA DESHIDRATADA")
})

test("management review screens are routed and gated by quotes:review", () => {
    const routes = fs.readFileSync("src/shared/router/AdminRoutes.tsx", "utf8")
    assert.match(routes, /path: "quote-reviews", component: QuoteReviewListPage, permission: "quotes:review"/)
    // El enlace del correo de aviso apunta a /admin/quote-reviews/:orderId.
    assert.match(routes, /path: "quote-reviews\/:orderId", component: QuoteReviewDetailPage, permission: "quotes:review"/)
    assert.match(fs.readFileSync("src/shared/layout/adminNavigation.ts", "utf8"), /url: "\/admin\/quote-reviews",[^\n]*permission: "quotes:review"/)
})

test("profit and review texts exist in Spanish and English", () => {
    const keys = ["quote.profit.finalPrice", "quote.profit.help", "quote.profit.stale", "quoteReview.list.title", "quoteReview.profit.approve", "quoteReview.profit.reject", "quoteReview.notification.status.not_configured", "quoteReview.detail.loadError",
        "quoteReview.status.rejected", "quoteReview.rejectModal.reason", "quoteReview.deliveryModal.option.none.title", "quoteReview.delivery.status.notSent", "quote.orderReview.rejected", "quote.orderReview.approvedNotSent"]
    for (const language of ["es", "en"]) {
        const resources = require(`../src/shared/i18n/locales/${language}/translation.json`)
        for (const key of keys) assert.equal(typeof key.split(".").reduce((node, part) => node?.[part], resources), "string", `${language}:${key}`)
    }
})

test("the client's approved-quote PDF uses the representative view of each line (no internal costs) with its final price", () => {
    const { clientDocumentLines } = loader({
        "@/feature/destination/schema/destination.schema": { responseDestinationSchema: require("zod").z.object({}) },
        "@react-pdf/renderer": { pdf: () => ({ toBlob: async () => null }) },
        "@/feature/quote/component/quotePdfDocument.component": { QuotePdfDocument: "QuotePdfDocument" },
    })("src/feature/quoteReview/util/quoteReviewClientPdf.tsx")
    const pricing = { profitPerPound: 0.25, netPounds: 100, totalCost: 115, profitTotal: 25, finalPrice: 140, lines: [{ kind: "fixed", quoteId: 7, productDisplayName: "PIÑA", totalCost: 115, netPounds: 100, profitPerPound: 0.25, profitTotal: 25, finalPrice: 140 }] }
    const [line] = clientDocumentLines([savedLine()], pricing)
    assert.equal(line.finalPrice, 140)
    for (const key of ["totalCost", "rawMaterialCost", "unitPackagingCost", "palletMaterialCost", "transportCost"]) assert.equal(key in line, false, key)
    // Una línea sin precio aprobado o ilegible: no se arma un PDF incompleto para el cliente.
    assert.equal(clientDocumentLines([savedLine(), savedLine({ id: 8 })], pricing), null)
    assert.equal(clientDocumentLines([savedLine({ breakdown: null })], pricing), null)
})

test("client documents only price lines with the approved final price, never the internal cost", () => {
    const { clientLinePrice, linePrice } = load("src/feature/quote/util/quoteAmounts.ts")
    const { calculateQuoteOrderTotal } = load("src/feature/quote/util/quotePdfSummary.ts")
    const costOnly = { totalCost: 115 }, approved = { totalCost: 115, finalPrice: 140 }
    assert.equal(linePrice(costOnly), 115) // Pantallas internas del admin.
    assert.equal(clientLinePrice(costOnly), null)
    assert.equal(clientLinePrice(approved), 140)
    assert.equal(calculateQuoteOrderTotal([approved, costOnly], clientLinePrice), null)
    assert.equal(calculateQuoteOrderTotal([approved, approved], clientLinePrice), 280)
})

test("the client email rule matches the backend schema", () => {
    const { isValidClientEmail } = load("src/feature/quote/util/clientEmail.ts")
    for (const value of ["compras@cliente.com", "  Compras@Cliente.COM ", "a.b+tag@sub.example.org"]) assert.equal(isValidClientEmail(value), true, value)
    for (const value of ["", "compras", "a..b@example.invalid", "a@b", "a b@c.com", `${"a".repeat(250)}@c.com`]) assert.equal(isValidClientEmail(value), false, value)
})

test("next to Calculate, the representative sees that the order goes to review and the optional client email; the admin calculator shows nothing", () => {
    const render = context => loader({
        react: { ...require("react"), useContext: () => context, useState: initial => [initial, () => {}] },
        "react-i18next": { useTranslation: () => ({ t: key => key }) },
    })("src/feature/quote/component/quoteSendsToNotice.component.tsx").QuoteSendsToNotice()
    const text = tree => !tree || typeof tree !== "object" ? String(tree ?? "") : [].concat(tree.props?.children ?? []).flat(Infinity).map(text).join(" ")
    assert.equal(render(null), null)
    assert.match(text(render({ email: "compras@cliente.com", onChange: () => {} })), /compras@cliente\.com/)
    // Sin correo no se pide aquí: es opcional y el campo ya está bajo el cliente.
    const withoutEmail = render({ email: "", onChange: () => {} })
    assert.equal(withoutEmail.type, "p")
    assert.match(text(withoutEmail), /quote\.orderReview\.sendsTo/)
    assert.doesNotMatch(text(withoutEmail), /clientEmailLabel/)
})

test("a pending review whose update failed offers to send it again", () => {
    const { QuoteOrderReviewPanel } = loader({
        "react-i18next": { useTranslation: () => ({ t: key => key, i18n: { language: "es" } }) },
    })("src/feature/quote/component/quoteOrderReviewPanel.component.tsx")
    const nodes = tree => !tree || typeof tree !== "object" ? [] : [tree, ...[].concat(tree.props?.children ?? []).flat(Infinity).flatMap(nodes)]
    const review = { orderId, status: "pending", submittedAt: new Date("2026-10-28T17:00:00Z"), reviewedAt: null, clientEmail: "compras@cliente.com", deliveryStatus: "pending", deliveryRecipients: null }
    let submitted = 0
    const props = { review, isLoading: false, isError: false, isRefreshing: false, isSubmitting: false, isSubmitError: true, clientEmail: "compras@cliente.com", onClientEmailChange: () => {}, onSubmit: () => submitted++, onRefresh: () => {} }
    const retry = nodes(QuoteOrderReviewPanel(props)).find(node => node.props?.onClick === props.onSubmit)
    assert.ok(retry)
    retry.props.onClick()
    assert.equal(submitted, 1)
    assert.ok(!nodes(QuoteOrderReviewPanel({ ...props, isSubmitError: false })).some(node => node.props?.onClick === props.onSubmit))
})

test("the order reaches management without the client's email; only a typed but invalid email holds it until fixed or cleared", () => {
    // Mini renderer: hooks keep their slots between renders and effects run after each render, when their deps change.
    let slots = [], cursor = 0, effects = []
    const React = {
        useRef: initial => { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index] },
        useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = value }] },
        useEffect: (effect, deps) => {
            const index = cursor++, previous = slots[index]
            if (!previous || deps.some((dep, i) => !Object.is(dep, previous[i]))) { slots[index] = deps; effects.push(effect) }
        },
    }
    const sent = []
    // Stable like TanStack Query's mutate.
    const mutate = email => sent.push(email)
    let review = { status: "pending" }
    const reviewOf = loader({
        react: React,
        sonner: { toast: { success: () => {} } },
        "@/shared/i18n/showErrorToast": { showErrorToast: () => {} },
        "@/feature/quote/api/quoteOrderReview.api": { getQuoteOrderReviewAPI: () => {}, submitQuoteOrderReviewAPI: () => {} },
        "@tanstack/react-query": {
            useQueryClient: () => ({ getQueryData: () => review, setQueryData: () => {} }),
            useQuery: () => ({ data: review, isSuccess: true, isLoading: false, isError: false, isFetching: false, refetch: () => {} }),
            useMutation: () => ({ mutate, isPending: false, isError: false }),
        },
    })("src/feature/quote/hook/useQuoteOrderReview.ts").useQuoteOrderReview
    const render = (lineCount, email) => {
        cursor = 0; effects = []
        reviewOf(orderId, lineCount, email)
        for (const effect of effects) effect()
        cursor = 0
        return reviewOf(orderId, lineCount, email)
    }
    // First product without email: sent on its own, without an email (never an empty or invented one).
    assert.equal(render(1, "").hasUnsentLines, false)
    assert.deepEqual(sent, [undefined])
    // Second product with a valid email: sent with it.
    assert.equal(render(2, " compras@cliente.com ").hasUnsentLines, false)
    assert.deepEqual(sent, [undefined, "compras@cliente.com"])
    // Third product with a half-typed email: held, and the backup asks to fix it.
    assert.equal(render(3, "compras@cli").hasUnsentLines, true)
    assert.equal(sent.length, 2)
    const held = render(3, "compras@cli")
    held.submit() // An invalid email is never sent.
    assert.equal(sent.length, 2)
    // Clearing it is enough (the email is optional): the backup sends without it.
    const cleared = render(3, "")
    cleared.submit()
    assert.deepEqual(sent, [undefined, "compras@cliente.com", undefined])
    assert.equal(render(3, "").hasUnsentLines, false)
    // A decided order (approved or rejected) is never sent again.
    review = { status: "rejected" }
    render(4, "")
    assert.equal(sent.length, 3)
})

test("the representative panel: an empty email can be sent, an invalid one cannot; rejected shows its reason; approved says what management sent", () => {
    const { QuoteOrderReviewPanel } = loader({
        "react-i18next": { useTranslation: () => ({ t: (key, values) => `${key}${values ? JSON.stringify(values) : ""}`, i18n: { language: "es" } }) },
    })("src/feature/quote/component/quoteOrderReviewPanel.component.tsx")
    const nodes = tree => !tree || typeof tree !== "object" ? [] : [tree, ...[].concat(tree.props?.children ?? []).flat(Infinity).flatMap(nodes)]
    const text = tree => nodes(tree).flatMap(node => [].concat(node.props?.children ?? [])).filter(child => typeof child === "string").join(" ")
    const onSubmit = () => {}
    const base = { isLoading: false, isError: false, isRefreshing: false, isSubmitting: false, isSubmitError: false, hasUnsentLines: false, clientEmail: "", onClientEmailChange: () => {}, onSubmit, onRefresh: () => {} }
    const submitButton = props => nodes(QuoteOrderReviewPanel({ ...base, review: null, ...props })).find(node => node.props?.onClick === onSubmit)
    assert.equal(submitButton({}).props.disabled, false)
    assert.equal(submitButton({ clientEmail: "compras@cli" }).props.disabled, true)
    const decided = { orderId, submittedAt: new Date("2026-10-28T17:00:00Z"), reviewedAt: new Date("2026-10-29T17:00:00Z"), clientEmail: null }
    const rejected = text(QuoteOrderReviewPanel({ ...base, review: { ...decided, status: "rejected", deliveryStatus: "pending", deliveryRecipients: null, rejectionReason: "No contamos con el producto" } }))
    assert.match(rejected, /quote\.orderReview\.rejected/)
    assert.match(rejected, /No contamos con el producto/)
    const approved = review => text(QuoteOrderReviewPanel({ ...base, review: { ...decided, status: "approved", ...review } }))
    assert.match(approved({ deliveryStatus: "pending", deliveryRecipients: null }), /approvedNotSent/)
    assert.match(approved({ deliveryStatus: "sent", deliveryRecipients: "representative" }), /approvedSentToYou/)
    assert.match(approved({ deliveryStatus: "sent", deliveryRecipients: "representative_and_client", clientEmail: "compras@cliente.com" }), /approvedSentWithClient.*compras@cliente\.com/)
    assert.match(approved({ deliveryStatus: "failed", deliveryRecipients: "representative" }), /approvedDeliveryFailed/)
})

test("management's delivery decision: only the copy to the client carries its email, and it must be valid", () => {
    const { quoteReviewDeliveryRequest } = load("src/feature/quoteReview/util/quoteReviewDelivery.ts")
    assert.deepEqual(quoteReviewDeliveryRequest("none", "compras@cliente.com"), { delivery: "none" })
    assert.deepEqual(quoteReviewDeliveryRequest("representative", "compras@cliente.com"), { delivery: "representative" })
    assert.deepEqual(quoteReviewDeliveryRequest("representative_and_client", " compras@cliente.com "), { delivery: "representative_and_client", clientEmail: "compras@cliente.com" })
    for (const email of ["", "compras@cli", "no es correo"]) assert.equal(quoteReviewDeliveryRequest("representative_and_client", email), null, email)
})

test("the representative has no way to email a quote: no API, no route call and no email action in their summary", () => {
    const files = []
    const walk = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full); else if (/\.tsx?$/.test(entry.name)) files.push(full) } }
    walk("src")
    for (const file of files) assert.doesNotMatch(fs.readFileSync(file, "utf8"), /["'`]\/quotes\/send-email/, file)
    assert.doesNotMatch(fs.readFileSync("src/feature/quote/api/quote.api.ts", "utf8"), /sendQuotePdfEmailAPI/)
    assert.doesNotMatch(fs.readFileSync("src/feature/quote/component/representativeOrderSummary.component.tsx", "utf8"), /sendEmailAPI/)
})

test("management approves only the lines it calculated: a reloaded detail with other lines drops the calculation, and the approval sends that calculation's digest", async () => {
    let slots = [], cursor = 0, mutations = []
    const React = { useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = value }] } }
    let detail = { linesDigest: "a".repeat(64), review: {} }
    const approved = []
    const useQuoteReview = loader({
        react: React,
        sonner: { toast: { success() {}, error() {}, warning() {} } },
        "react-i18next": { useTranslation: () => ({ t: key => key }) },
        "@/shared/i18n/showErrorToast": { showErrorToast() {} },
        "@/feature/quoteReview/util/quoteReviewClientPdf": { buildQuoteReviewClientPdf: async () => ({}) },
        "@/feature/quoteReview/api/quoteReview.api": { approveQuoteReviewAPI: async (_orderId, input) => { approved.push(input) } },
        "@tanstack/react-query": {
            useQueryClient: () => ({ invalidateQueries() {} }),
            useQuery: () => ({ data: { data: detail }, refetch() {} }),
            useMutation: options => { mutations.push(options); return { mutate() {}, isPending: false } },
        },
    })("src/feature/quoteReview/hook/useQuoteReview.ts").useQuoteReview
    const render = () => { cursor = 0; mutations = []; return useQuoteReview(orderId) }
    render()
    // mutations: [preview, approve, reject, notify, deliver]
    mutations[0].onSuccess({ data: { finalPrice: 10, linesDigest: "a".repeat(64) } }, "0.25")
    assert.deepEqual(render().preview, { amount: "0.25", pricing: { finalPrice: 10 }, linesDigest: "a".repeat(64) })
    await mutations[1].mutationFn({ delivery: "none" })
    assert.equal(approved[0].linesDigest, "a".repeat(64))
    // The representative added a line and the detail reloaded: the old calculation no longer allows approving.
    detail = { linesDigest: "b".repeat(64), review: {} }
    assert.equal(render().preview, null)
})
