// Synthetic fixtures for tests only. Production details always come from the API.
const material = (id, displayName, code) => ({ id, displayName, code, isActive: true, costPerUnit: 1.2345, costUnit: { unitCode: "lb", displayName: "Libra" } })
const packaging = (id, displayName, code, packagingRole) => ({ id, displayName, code, packagingRole, isActive: true, unitCost: 0.125 })
const fixedProduct = {
    id: 1, displayName: "Producto de prueba con nombre largo para verificar la lectura de toda la configuración registrada", isActive: false,
    isOrganic: true, imageUrl: null, additionalCostPerUnit: 0,
    client: { id: 1, name: "Cliente de prueba", isActive: true },
    parentSubCategory: { id: 2, displayName: "Subcategoría registrada", parentCategory: { id: 3, displayName: "Categoría registrada" } },
    productRawMaterials: [
        { id: 1, isActive: true, percentage: 60, usedRawMaterial: { ...material(1, "Materia prima con nombre completo y características registradas", "TEST-MP-" + "A".repeat(50)), isOrganic: true, ingredientType: "fruit" } },
        { id: 2, isActive: true, percentage: 40, usedRawMaterial: { ...material(2, "Segunda materia prima", "TEST-MP-2"), isOrganic: true, ingredientType: "fruit" } },
    ],
    productIngredients: [{ id: 3, isActive: true, grams: 12.5, referenceNetWeightGrams: 1000, usedIngredient: material(3, "Ingrediente agregado", "TEST-ING-3") }],
    productVariants: [
        { id: 10, skuCode: "TEST-SKU-10", isActive: true, boxesPerPallet: 40, bagsPerBox: 12, unitsPerIntermediatePackage: null,
            sizePresentation: { id: 20, displayLabel: "Presentación pequeña", netWeightGrams: 500, isActive: true },
            unitMaterials: [{ id: 30, isActive: true, quantityPerUnit: 1, optionGroup: null, isDefault: false, optionGroupCatalog: null, usedUnitMaterial: packaging(40, "Bolsa de prueba", "TEST-BAG-40", "unit") }],
            intermediateMaterials: [],
            palletMaterials: [{ id: 31, isActive: true, quantityValue: 1, quantityBasis: "per_pallet", optionGroup: null, isDefault: false, packagingGroup: null, usedPalletMaterial: packaging(41, "Pallet de prueba", "TEST-PALLET-41", "pallet") }],
        },
        { id: 11, skuCode: "TEST-SKU-11-" + "B".repeat(40), isActive: false, boxesPerPallet: 60, bagsPerBox: 24, unitsPerIntermediatePackage: 6,
            sizePresentation: { id: 21, displayLabel: "Presentación grande", netWeightGrams: 1000, isActive: false },
            unitMaterials: [{ id: 32, isActive: true, quantityPerUnit: 2, optionGroup: "Envase", isDefault: true, optionGroupCatalog: { id: 7, displayName: "Envases registrados" }, usedUnitMaterial: packaging(42, "Envase de prueba para segunda presentación", "TEST-BOTTLE-42", "unit") },
                { id: 33, isActive: false, quantityPerUnit: 1, optionGroup: "Envase", isDefault: false, optionGroupCatalog: { id: 7, displayName: "Envases registrados" }, usedUnitMaterial: packaging(43, "Envase alternativo", "TEST-ALTERNATIVE-43", "unit") }],
            intermediateMaterials: [{ id: 34, isActive: true, optionGroup: null, isDefault: false, usedIntermediateMaterial: packaging(44, "Caja intermedia de prueba", "TEST-INTERMEDIATE-44", "intermediate") }],
            palletMaterials: [{ id: 35, isActive: true, quantityValue: 0.25, quantityBasis: "per_box", optionGroup: "Caja", isDefault: true, packagingGroup: { id: 8, displayName: "Cajas registradas" }, usedPalletMaterial: packaging(45, "Caja de exportación de prueba", "TEST-EXPORT-45", "pallet") }],
        },
    ],
}
module.exports = { fixedProduct }
