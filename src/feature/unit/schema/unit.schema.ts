import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"
import { UNIT_CATALOG_KEYS } from "@/feature/unit/constant/unitCatalog"

const unitTypeEnum = z.enum(["weight", "volume", "count"])

// El admin ya no escribe displayName/unitType/baseFactor a mano: elige unitKey del catálogo
// fijo (ver constant/unitCatalog.ts) y el backend resuelve los 3 valores desde ahí.
export const createUnitSchema = z.object({
    unitKey: z.enum(UNIT_CATALOG_KEYS),
})

// No hace falta .partial(): unitKey es el único campo y no puede quedar vacío ni siquiera al
// editar.
export const updateUnitSchema = createUnitSchema

export const responseUnitSchema = baseCatalogSchema.extend({
    unitCode: z.string(),
    displayName: z.string(),
    unitType: unitTypeEnum,
    // DECIMAL en Postgres: Sequelize lo devuelve como string en un SELECT normal, pero como
    // número tras un .update() -- z.coerce.number() acepta ambos formatos.
    baseFactor: z.coerce.number(),
})

export type CreateUnitInput = z.infer<typeof createUnitSchema>
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>
export type UnitResponse = z.infer<typeof responseUnitSchema>
