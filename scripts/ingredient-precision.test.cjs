const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")
const { z } = require("zod")

function loadSchemas(file) {
    const source = fs.readFileSync(file, "utf8") + "\nexport { updateProductIngredientSchema }"
    const exports = {}
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, {
        exports, require: name => name === "zod" ? require("zod") : { baseCatalogSchema: z.object({}) },
    })
    return exports
}

test("frontend create and edit enforce the ingredient precision contract", () => {
    const schemas = loadSchemas("src/feature/product/schema/productIngredient.schema.ts")
    for (const [grams, referenceNetWeightGrams, valid] of [
        [0.001, 1000.01, true], [0.01, 1000, true], [0.25, 1000, true], [0.5, 1000, true],
        [9999999.999, 99999999.99, true], [0.0001, 1000, false], [1.2345, 1000, false],
        [1, 1000.001, false], [10000000, 99999999.99, false], [1, 100000000, false],
        [0, 1000, false], [-1, 1000, false], [1, 0, false], [Infinity, 1000, false],
    ]) {
        for (const name of ["createProductIngredientSchema", "updateProductIngredientSchema"]) {
            const input = { productId: 1, ingredientId: 2, grams, referenceNetWeightGrams }
            const result = schemas[name].safeParse(input)
            assert.equal(result.success, valid, `${name}: ${grams}/${referenceNetWeightGrams}`)
            if (valid) {
                assert.equal(result.data.grams, grams)
                assert.equal(result.data.referenceNetWeightGrams, referenceNetWeightGrams)
            }
        }
    }
})

test("administrative ingredient display preserves thousandths", () => {
    const source = fs.readFileSync("src/feature/product/component/productIngredientSection.component.tsx", "utf8")
    const declaration = source.match(/const numberFormatter = .*/)[0]
    const formatter = vm.runInNewContext(`${declaration}; numberFormatter`, { Intl })
    assert.equal(formatter.format(0.001), "0.001")
    assert.equal(formatter.format(0.01), "0.01")
    assert.equal(formatter.format(0.25), "0.25")
})
