import type { GenericAdminMaterial, GenericAdminOptions, GenericProfileInput, GenericSavedProfile } from "../schema/genericPackaging.schema";
type Group = GenericProfileInput["groups"][number];
type Option = Group["options"][number];
// Tarima, esquinero and stretch come from the pallet kit on every quote, never inside a configuration.
const PALLET_KIT_TYPES = ["TARIMA", "ESQUINERO", "STRETCH"];
export const offeredMaterials = (catalog: GenericAdminOptions, level: Group["level"]) => catalog.materials.filter(row => row.packagingRole === level && !PALLET_KIT_TYPES.includes(row.materialType));
// Names of what a saved configuration uses. An item later deactivated in its catalog keeps showing
// (marked unavailable) instead of a blank field that looks like the configuration lost it.
export type SavedNames = { category?: string; presentation?: string; groups: Map<number, string>; materials: Map<number, string> };
export function savedNames(profile?: GenericSavedProfile): SavedNames {
    return {
        category: profile?.category?.displayName, presentation: profile?.presentation?.displayLabel,
        groups: new Map((profile?.groups ?? []).map(group => [group.packagingGroupId, group.group?.displayName ?? ""])),
        materials: new Map((profile?.groups ?? []).flatMap(group => group.options.map(option => [option.packagingId, option.packaging?.displayName ?? ""] as const))),
    };
}
export type Availability = { category: (id: number) => boolean; presentation: (id: number) => boolean; group: (id: number) => boolean; material: (id: number, level: Group["level"]) => boolean };
export function catalogAvailability(catalog: GenericAdminOptions): Availability {
    return {
        category: id => catalog.categories.some(row => row.id === id),
        presentation: id => catalog.presentations.some(row => row.id === id),
        group: id => catalog.groups.some(row => row.id === id),
        material: (id, level) => offeredMaterials(catalog, level).some(row => row.id === id),
    };
}
// How the representative uses a group, shown to the admin as one choice instead of mode + required.
export const GROUP_USAGES = {
    always: { selectionMode: "all", isRequired: true },
    choose: { selectionMode: "one", isRequired: true },
    optional: { selectionMode: "one", isRequired: false },
    optionalAll: { selectionMode: "all", isRequired: false },
} as const;
export type GroupUsage = keyof typeof GROUP_USAGES;
export function groupUsage(group: Pick<Group, "selectionMode" | "isRequired">): GroupUsage {
    if (group.selectionMode === "all") return group.isRequired ? "always" : "optionalAll";
    return group.isRequired ? "choose" : "optional";
}
// Pallet materials take the catalog consumption (e.g. corner boards 4, pallet 1, stretch 93.3 per pallet),
// like fixed SKUs; without a catalog rule the current values stay for the admin to complete.
export function withCatalogConsumption(option: Option, level: Group["level"], material: GenericAdminMaterial | undefined): Option {
    if (level !== "pallet" || !material?.defaultQuantityBasis || material.defaultQuantityValue == null) return option;
    return { ...option, quantityBasis: material.defaultQuantityBasis, quantityValue: Number(material.defaultQuantityValue) };
}
export const GENERIC_LEVELS = ["unit", "intermediate", "pallet"] as const;
export const emptyGenericProfile = (): GenericProfileInput => ({ reference: "", displayName: "", categoryId: 0, presentationId: 0, bagsPerBox: 1, boxesPerPallet: 1, unitsPerIntermediatePackage: null, isActive: true, groups: [] });
export function newGenericGroup(level: Group["level"]): Group {
    return { packagingGroupId: 0, level, ...GROUP_USAGES.always, options: [] };
}
export function newGenericOption(level: Group["level"], packagingId = 0): Option {
    if (level === "unit") return { packagingId, quantityBasis: "per_unit", quantityValue: 1 };
    if (level === "intermediate") return { packagingId, quantityBasis: "per_intermediate", quantityValue: null };
    return { packagingId, quantityBasis: "per_pallet", quantityValue: null };
}
export function usesCatalogConsumption(option: Option, material: GenericAdminMaterial | undefined) {
    return !!material?.defaultQuantityBasis && material.defaultQuantityValue != null
        && option.quantityBasis === material.defaultQuantityBasis && option.quantityValue === Number(material.defaultQuantityValue);
}
export type FormProblem = { key: string; params?: Record<string, string> };
// Plain-language list of what is still missing, shown before sending; the server validates again.
export function genericFormProblems(input: GenericProfileInput, names: { group: (id: number) => string; material: (id: number) => string; level: (level: Group["level"]) => string }, available?: Availability): FormProblem[] {
    const problems: FormProblem[] = [];
    if (!input.displayName.trim()) problems.push({ key: "displayName" });
    if (!input.reference.trim()) problems.push({ key: "reference" });
    if (!input.categoryId) problems.push({ key: "category" });
    else if (available && !available.category(input.categoryId)) problems.push({ key: "categoryUnavailable" });
    if (!input.presentationId) problems.push({ key: "presentation" });
    else if (available && !available.presentation(input.presentationId)) problems.push({ key: "presentationUnavailable" });
    if (!(input.bagsPerBox > 0) || !(input.boxesPerPallet > 0)) problems.push({ key: "logistics" });
    if (!input.groups.length) problems.push({ key: "noGroups" });
    if (input.groups.some(group => group.level === "intermediate") && !(Number(input.unitsPerIntermediatePackage) > 0)) problems.push({ key: "intermediateUnits" });
    const seen = new Set<string>();
    for (const group of input.groups) {
        const level = names.level(group.level);
        if (!group.packagingGroupId) { problems.push({ key: "groupMissing", params: { level } }); continue; }
        const groupName = names.group(group.packagingGroupId);
        if (available && !available.group(group.packagingGroupId)) problems.push({ key: "groupUnavailable", params: { group: groupName, level } });
        if (seen.has(`${group.level}:${group.packagingGroupId}`)) problems.push({ key: "duplicateGroup", params: { group: groupName, level } });
        seen.add(`${group.level}:${group.packagingGroupId}`);
        if (!group.options.length) problems.push({ key: "groupEmpty", params: { group: groupName } });
        for (const option of group.options) {
            if (!option.packagingId) { problems.push({ key: "materialMissing", params: { group: groupName } }); continue; }
            if (available && !available.material(option.packagingId, group.level)) problems.push({ key: "materialUnavailable", params: { material: names.material(option.packagingId), group: groupName } });
            if (group.level !== "intermediate" && !(Number(option.quantityValue) > 0)) problems.push({ key: "quantityMissing", params: { material: names.material(option.packagingId) } });
        }
    }
    return problems;
}
