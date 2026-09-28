import { z } from "zod"

// Grupos de opciones de empaque -- compartido por las tres secciones
// admin de materiales (unit / intermediate / pallet). En la API la fila solo tiene `optionGroup`
// (string | null; null = fila fija). En el FORM se desdobla en un checkbox "el cliente elige"
// (isOptional, solo de formulario) + el nombre del grupo como texto, para que el admin siga
// pensando en "¿es opcional?" y recién ahí escriba el grupo. El backend normaliza el nombre y
// adopta la grafía de un grupo ya existente del SKU ("caja" se une a "Caja").

export const MATERIAL_OPTION_GROUP_MAX_LENGTH = 60

export const materialOptionGroupFormShape = {
    isOptional: z.boolean(),
    optionGroup: z.string().max(MATERIAL_OPTION_GROUP_MAX_LENGTH),
}

type MaterialOptionGroupFormValues = { isOptional: boolean; optionGroup: string; isDefault: boolean }

// Valores iniciales / tras reset: el nombre del grupo y el checkbox de default solo se montan
// cuando la fila es opcional, así que sin estos defaults quedarían undefined y zod los rechazaría.
export const EMPTY_MATERIAL_OPTION_GROUP_VALUES: MaterialOptionGroupFormValues = {
    isOptional: false,
    optionGroup: "",
    isDefault: false,
}

// Solo exige el nombre cuando la fila es opcional -- una fila fija ignora lo que haya en el input.
export function refineMaterialOptionGroup(values: { isOptional: boolean; optionGroup: string }, ctx: z.RefinementCtx): void {
    if (values.isOptional && values.optionGroup.trim() === "") {
        ctx.addIssue({ code: "custom", path: ["optionGroup"], message: "optionGroupRequired" })
    }
}

export function toMaterialOptionGroupPayload<T extends MaterialOptionGroupFormValues>(
    values: T
): Omit<T, "isOptional" | "optionGroup" | "isDefault"> & { optionGroup: string | null; isDefault: boolean } {
    const { isOptional, optionGroup, isDefault, ...rest } = values
    return {
        ...rest,
        optionGroup: isOptional ? optionGroup.trim() : null,
        isDefault: isOptional && isDefault,
    }
}

export function toMaterialOptionGroupFormValues(item: { optionGroup: string | null; isDefault: boolean }): MaterialOptionGroupFormValues {
    return {
        isOptional: item.optionGroup !== null,
        optionGroup: item.optionGroup ?? "",
        isDefault: item.optionGroup !== null && item.isDefault,
    }
}

// Misma regla de comparación que el backend (shared/utils/optionGroup.util.ts): sin mayúsculas y
// con espacios colapsados.
function optionGroupKey(value: string): string {
    return value.trim().split(/\s+/).join(" ").toLowerCase()
}

// Nombres de grupo ya usados en las filas de la variante activa (sugerencias del <datalist>), sin
// duplicados por mayúsculas/espacios.
export function listMaterialOptionGroups(rows: { optionGroup: string | null }[]): string[] {
    const byKey = new Map<string, string>()
    for (const row of rows) {
        if (row.optionGroup !== null && !byKey.has(optionGroupKey(row.optionGroup))) {
            byKey.set(optionGroupKey(row.optionGroup), row.optionGroup)
        }
    }
    return [...byKey.values()].sort((a, b) => a.localeCompare(b))
}

// Tabla admin: filas fijas primero, luego agrupadas por grupo (alfabético) y por id dentro de cada
// grupo -- así las alternativas de un mismo grupo quedan juntas.
export function sortByMaterialOptionGroup<T extends { id: number; optionGroup: string | null }>(rows: T[]): T[] {
    return [...rows].sort((a, b) => {
        if (a.optionGroup === null || b.optionGroup === null) {
            if (a.optionGroup === b.optionGroup) return a.id - b.id
            return a.optionGroup === null ? -1 : 1
        }
        return optionGroupKey(a.optionGroup).localeCompare(optionGroupKey(b.optionGroup)) || a.id - b.id
    })
}
