import type { z } from "zod"
import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiListResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import {
    customQuoteConfigMutationItemSchema,
    customQuoteIngredientOptionSchema,
    customQuotePackagingOptionSchema,
    customQuotePresentationOptionSchema,
    customQuoteRawMaterialOptionSchema,
} from "@/feature/customQuote/schema/customQuoteConfig.schema"
import type {
    CreateCustomQuoteIngredientOptionInput,
    CreateCustomQuotePackagingOptionInput,
    CreateCustomQuotePresentationOptionInput,
    CreateCustomQuoteRawMaterialOptionInput,
    UpdateCustomQuoteIngredientOptionInput,
    UpdateCustomQuotePackagingOptionInput,
    UpdateCustomQuotePresentationOptionInput,
    UpdateCustomQuoteRawMaterialOptionInput,
} from "@/feature/customQuote/schema/customQuoteConfig.schema"

// Backend: /admin/custom-quote-config/<lista> (customQuoteConfig:edit). Las cuatro listas comparten
// contrato: GET lista, POST, PATCH /:id, PATCH /:id/status.
const BASE = "/admin/custom-quote-config"
const mutationResponseSchema = apiMutationResponseSchema(customQuoteConfigMutationItemSchema)

async function listOptions<ItemSchema extends z.ZodTypeAny>(path: string, itemSchema: ItemSchema) {
    try {
        const { data } = await api.get(`${BASE}${path}`)
        return apiListResponseSchema(itemSchema).parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

async function createOption(path: string, formData: object) {
    try {
        const { data } = await api.post(`${BASE}${path}`, formData)
        return mutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

async function updateOption(path: string, id: number, formData: object) {
    try {
        const { data } = await api.patch(`${BASE}${path}/${id}`, formData)
        return mutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

async function setOptionStatus(path: string, id: number, isActive: boolean) {
    try {
        const { data } = await api.patch(`${BASE}${path}/${id}/status`, { isActive })
        return mutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

const RAW_MATERIALS = "/raw-material-options"
const INGREDIENTS = "/ingredient-options"
const PRESENTATIONS = "/presentation-options"
const PACKAGINGS = "/packaging-options"

export const getCustomQuoteRawMaterialOptionsAPI = () => listOptions(RAW_MATERIALS, customQuoteRawMaterialOptionSchema)
export const createCustomQuoteRawMaterialOptionAPI = (formData: CreateCustomQuoteRawMaterialOptionInput) =>
    createOption(RAW_MATERIALS, formData)
export const updateCustomQuoteRawMaterialOptionAPI = (id: number, formData: UpdateCustomQuoteRawMaterialOptionInput) =>
    updateOption(RAW_MATERIALS, id, formData)
export const setCustomQuoteRawMaterialOptionStatusAPI = (id: number, isActive: boolean) =>
    setOptionStatus(RAW_MATERIALS, id, isActive)

export const getCustomQuoteIngredientOptionsAPI = () => listOptions(INGREDIENTS, customQuoteIngredientOptionSchema)
export const createCustomQuoteIngredientOptionAPI = (formData: CreateCustomQuoteIngredientOptionInput) =>
    createOption(INGREDIENTS, formData)
export const updateCustomQuoteIngredientOptionAPI = (id: number, formData: UpdateCustomQuoteIngredientOptionInput) =>
    updateOption(INGREDIENTS, id, formData)
export const setCustomQuoteIngredientOptionStatusAPI = (id: number, isActive: boolean) =>
    setOptionStatus(INGREDIENTS, id, isActive)

export const getCustomQuotePresentationOptionsAPI = () => listOptions(PRESENTATIONS, customQuotePresentationOptionSchema)
export const createCustomQuotePresentationOptionAPI = (formData: CreateCustomQuotePresentationOptionInput) =>
    createOption(PRESENTATIONS, formData)
export const updateCustomQuotePresentationOptionAPI = (id: number, formData: UpdateCustomQuotePresentationOptionInput) =>
    updateOption(PRESENTATIONS, id, formData)
export const setCustomQuotePresentationOptionStatusAPI = (id: number, isActive: boolean) =>
    setOptionStatus(PRESENTATIONS, id, isActive)

export const getCustomQuotePackagingOptionsAPI = () => listOptions(PACKAGINGS, customQuotePackagingOptionSchema)
export const createCustomQuotePackagingOptionAPI = (formData: CreateCustomQuotePackagingOptionInput) =>
    createOption(PACKAGINGS, formData)
export const updateCustomQuotePackagingOptionAPI = (id: number, formData: UpdateCustomQuotePackagingOptionInput) =>
    updateOption(PACKAGINGS, id, formData)
export const setCustomQuotePackagingOptionStatusAPI = (id: number, isActive: boolean) =>
    setOptionStatus(PACKAGINGS, id, isActive)
