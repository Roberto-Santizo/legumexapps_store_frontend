import api from "@/shared/api/api";
import { handleApiError } from "@/shared/api/handleApiError";
import { genericSavedProfileSchema, genericAdminOptionsSchema, genericImportPreviewSchema, type GenericProfileInput } from "../schema/genericPackaging.schema";
import { z } from "zod";
const url = "/generic-packaging-configurations";
export async function getGenericProfiles() { try {
    return z.array(genericSavedProfileSchema).parse((await api.get(url)).data.data);
}
catch (error) {
    handleApiError(error);
} }
export async function getGenericOptions() { try {
    return genericAdminOptionsSchema.parse((await api.get(`${url}/options`)).data.data);
}
catch (error) {
    handleApiError(error);
} }
export async function saveGenericProfile(input: GenericProfileInput, id?: number) { try {
    return (id ? await api.put(`${url}/${id}`, input) : await api.post(url, input)).data;
}
catch (error) {
    handleApiError(error);
} }
export async function createGenericMaterial(input: unknown) { try {
    return (await api.post(`${url}/materials`, input)).data;
}
catch (error) {
    handleApiError(error);
} }
export async function downloadGenericTemplate() { try {
    return (await api.get(`${url}/bulk-import/template`, { responseType: "blob" })).data as Blob;
}
catch (error) {
    handleApiError(error);
} }
export async function previewGenericImport(file: File) { try {
    const form = new FormData();
    form.append("file", file);
    return genericImportPreviewSchema.parse((await api.post(`${url}/bulk-import/preview`, form)).data.data);
}
catch (error) {
    handleApiError(error);
} }
export async function confirmGenericImport(file: File, previewHash: string) { try {
    const form = new FormData();
    form.append("file", file);
    form.append("previewHash", previewHash);
    return (await api.post(`${url}/bulk-import/confirm`, form)).data;
}
catch (error) {
    handleApiError(error);
} }
