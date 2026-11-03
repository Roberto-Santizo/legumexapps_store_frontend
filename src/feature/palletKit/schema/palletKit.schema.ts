import { z } from "zod"

export const PALLET_KIT_TYPES = ["TARIMA", "ESQUINERO", "STRETCH"] as const
const kitMaterialSchema = z.object({ id: z.number().int(), code: z.string(), displayName: z.string(), displayNameEn: z.string().nullable().optional(), materialType: z.enum(PALLET_KIT_TYPES), unitCost: z.coerce.number() })
export const palletKitSchema = z.object({ complete: z.boolean(), palletRules: z.object({ defaultPackagingId: z.number().int().nullable(), overrides: z.array(z.object({ clientId: z.number().int(), packagingId: z.number().int() })) }).optional(), types: z.array(z.object({ type: z.enum(PALLET_KIT_TYPES), materials: z.array(kitMaterialSchema) })) })
export const palletKitCandidatesSchema = z.array(kitMaterialSchema)
export type PalletKit = z.infer<typeof palletKitSchema>
export type PalletKitMaterial = z.infer<typeof kitMaterialSchema>

export const palletRuleClientsSchema = z.array(z.object({ id: z.number().int(), name: z.string() }))
