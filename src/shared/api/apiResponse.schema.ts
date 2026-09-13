import { z } from "zod"

export function apiListResponseSchema<ItemSchema extends z.ZodTypeAny>(itemSchema: ItemSchema) {
    return z.object({
        data: z.array(itemSchema),
    })
}

export function apiPaginatedListResponseSchema<ItemSchema extends z.ZodTypeAny>(itemSchema: ItemSchema) {
    return z.object({
        data: z.array(itemSchema),
        meta: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            totalPages: z.number(),
        }),
    })
}

export function apiItemResponseSchema<ItemSchema extends z.ZodTypeAny>(itemSchema: ItemSchema) {
    return z.object({
        data: itemSchema,
    })
}

export function apiMutationResponseSchema<ItemSchema extends z.ZodTypeAny>(itemSchema: ItemSchema) {
    return z.object({
        message: z.string(),
        data: itemSchema,
    })
}

export const apiMessageResponseSchema = z.object({
    message: z.string(),
})

export type ApiMessageResponse = z.infer<typeof apiMessageResponseSchema>
