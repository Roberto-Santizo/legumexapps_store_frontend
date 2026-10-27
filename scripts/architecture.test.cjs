const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")

// Arquitectura por feature: estas reglas fallan si un cambio reintroduce dependencias circulares o
// mezcla tipos de archivo en las carpetas de un feature.
const src = path.resolve(__dirname, "..", "src")
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : /\.(ts|tsx)$/.test(entry.name) ? [path.join(directory, entry.name)] : [])
const posix = file => path.relative(src, file).split(path.sep).join("/")
const files = walk(src).map(file => ({ file: posix(file), text: fs.readFileSync(file, "utf8") }))
const featureOf = file => file.match(/^feature\/([^/]+)\//)?.[1]
const imports = ({ file, text }) => {
    const targets = []
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
    const visit = node => {
        let specifier
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) specifier = node.moduleSpecifier
        if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) specifier = node.arguments[0]
        if (specifier && (ts.isStringLiteral(specifier) || ts.isNoSubstitutionTemplateLiteral(specifier))) {
            const value = specifier.text
            if (value === "axios") targets.push("shared/api/axios")
            if (value.startsWith("@/")) targets.push(value.slice(2))
            else if (value.startsWith(".")) targets.push(path.posix.normalize(path.posix.join(path.posix.dirname(file), value)))
        }
        ts.forEachChild(node, visit)
    }
    visit(source)
    return targets
}
const importedFeatures = entry => new Set(imports(entry).map(featureOf).filter(Boolean))
const FEATURE_FOLDERS = new Set(["api", "schema", "component", "page", "constant", "hook", "util"])

test("features have no circular dependencies", () => {
    const graph = new Map()
    for (const entry of files) {
        const feature = featureOf(entry.file)
        if (!feature) continue
        const edges = graph.get(feature) ?? new Set()
        for (const target of importedFeatures(entry)) if (target !== feature) edges.add(target)
        graph.set(feature, edges)
    }
    const state = new Map(), cycles = []
    const visit = (node, trail) => {
        if (state.get(node) === "done") return
        if (state.get(node) === "active") { cycles.push([...trail.slice(trail.indexOf(node)), node].join(" -> ")); return }
        state.set(node, "active")
        for (const next of graph.get(node) ?? []) visit(next, [...trail, node])
        state.set(node, "done")
    }
    for (const node of graph.keys()) visit(node, [])
    assert.deepEqual(cycles, [])
})

test("shared code never imports features, except the router that composes them", () => {
    const offenders = files.filter(entry => entry.file.startsWith("shared/") && !entry.file.startsWith("shared/router/") && importedFeatures(entry).size > 0).map(entry => entry.file)
    assert.deepEqual(offenders, [])
})

test("feature files live in the standard folders and component folders only hold components", () => {
    const misplaced = files.filter(({ file }) => {
        if (!file.startsWith("feature/")) return false
        const parts = file.split("/")
        if (parts.length !== 4 || !FEATURE_FOLDERS.has(parts[2])) return true
        return (parts[2] === "component" && !parts[3].endsWith(".component.tsx")) || (parts[2] === "page" && !parts[3].endsWith(".page.tsx"))
    }).map(entry => entry.file)
    assert.deepEqual(misplaced, [])
})

test("HTTP clients are only used from api folders", () => {
    const offenders = files.filter(entry => imports(entry).some(target => /^shared\/api\/(api|salespersonApi|axios)(\.[cm]?[jt]s)?$/.test(target)) && !/^(feature\/[^/]+\/api|shared\/api)\//.test(entry.file)).map(entry => entry.file)
    assert.deepEqual(offenders, [])
})

test("feature file names are camelCase", () => {
    const offenders = files.filter(({ file }) => file.startsWith("feature/") && !/^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*\.tsx?$/.test(file.split("/").at(-1))).map(entry => entry.file)
    assert.deepEqual(offenders, [])
})

test("shared/component only holds components", () => {
    const misplaced = files.filter(({ file }) => /^shared\/component\//.test(file) && !file.endsWith(".component.tsx")).map(entry => entry.file)
    assert.deepEqual(misplaced, [])
})

for (const text of ["import x from '@/feature/example/api/example'", "export { x } from '@/feature/example/api/example'", "const x = require('@/feature/example/api/example')", "const x = import(`@/feature/example/api/example`)"]) {
    test(`checks feature dependencies expressed as ${text}`, () => {
        assert.deepEqual([...importedFeatures({ file: "shared/util/example.ts", text })], ["example"])
    })
}
test("resolves relative HTTP client imports", () => {
    assert.deepEqual(imports({ file: "feature/example/component/example.component.tsx", text: "const api = require('../../../shared/api/api')" }), ["shared/api/api"])
})
