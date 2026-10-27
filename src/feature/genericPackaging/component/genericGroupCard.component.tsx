import { useTranslation } from "react-i18next";
import { Check, Plus, Trash2 } from "lucide-react";
import type { GenericAdminOptions, GenericProfileInput } from "../schema/genericPackaging.schema";
import { GROUP_USAGES, groupUsage, newGenericOption, offeredMaterials, usesCatalogConsumption, withCatalogConsumption, type GroupUsage, type SavedNames } from "../util/genericPackagingForm";
import { FormField } from "@/shared/component/formField.component";
import { Select } from "@/shared/component/select.component";
import { Input } from "@/shared/component/input.component";
import { Button } from "@/shared/component/button.component";

type Group = GenericProfileInput["groups"][number];
type Props = {
    group: Group;
    index: number;
    catalog: GenericAdminOptions;
    savedNames?: SavedNames;
    onChange: (patch: Partial<Group>) => void;
    onRemove: () => void;
    onCreateMaterial: () => void;
};

const iconButton = "flex size-11 shrink-0 items-center justify-center rounded-control text-danger transition-colors hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

// One packaging group of a level: which catalog group it is, how the representative uses it and its generic materials.
export function GenericGroupCard({ group, index, catalog, savedNames, onChange, onRemove, onCreateMaterial }: Readonly<Props>) {
    const { t } = useTranslation();
    const levelMaterials = offeredMaterials(catalog, group.level);
    const groupUnavailable = !!group.packagingGroupId && !catalog.groups.some(row => row.id === group.packagingGroupId);
    const groupName = catalog.groups.find(row => row.id === group.packagingGroupId)?.displayName ?? (savedNames?.groups.get(group.packagingGroupId) || t("genericPackaging.group"));
    const patchOption = (position: number, value: Partial<Group["options"][number]>) => onChange({ options: group.options.map((option, k) => k === position ? { ...option, ...value } : option) });
    const chooseMaterial = (position: number, packagingId: number) => onChange({ options: group.options.map((option, k) => k === position
        ? withCatalogConsumption(newGenericOption(group.level, packagingId), group.level, catalog.materials.find(row => row.id === packagingId)) : option) });
    return <div className="rounded-xl border border-line bg-surface p-4">
        <div className="grid gap-x-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start">
            <FormField label={t("genericPackaging.group")} htmlFor={`group-${index}`} required>
                <Select id={`group-${index}`} required value={group.packagingGroupId || ""} onChange={event => onChange({ packagingGroupId: Number(event.target.value) })}>
                    <option value="">{t("common.selectPlaceholder")}</option>
                    {groupUnavailable && <option value={group.packagingGroupId}>{t("genericPackaging.form.unavailable", { name: groupName })}</option>}
                    {catalog.groups.map(row => <option key={row.id} value={row.id}>{row.displayName}</option>)}
                </Select>
            </FormField>
            <FormField label={t("genericPackaging.usage")} htmlFor={`usage-${index}`}>
                <Select id={`usage-${index}`} value={groupUsage(group)} onChange={event => onChange(GROUP_USAGES[event.target.value as GroupUsage])}>
                    {(["always", "choose", "optional"] as const).map(usage => <option key={usage} value={usage}>{t(`genericPackaging.usages.${usage}`)}</option>)}
                    {groupUsage(group) === "optionalAll" && <option value="optionalAll">{t("genericPackaging.usages.optionalAll")}</option>}
                </Select>
            </FormField>
            <button type="button" className={`${iconButton} sm:mt-7`} aria-label={t("genericPackaging.form.removeGroup", { group: groupName })} onClick={onRemove}><Trash2 size={18} aria-hidden="true" /></button>
        </div>
        <ul className="space-y-3">
            {group.options.map((option, j) => {
                const material = catalog.materials.find(row => row.id === option.packagingId);
                const materialUnavailable = !!option.packagingId && !levelMaterials.some(row => row.id === option.packagingId);
                const takenElsewhere = new Set(group.options.filter((_, k) => k !== j).map(row => row.packagingId));
                return <li key={j} className="rounded-lg bg-canvas p-3">
                    <div className="grid gap-x-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_auto] sm:items-start">
                        <FormField label={t("genericPackaging.material")} htmlFor={`option-${index}-${j}`} required>
                            <Select id={`option-${index}-${j}`} required value={option.packagingId || ""} onChange={event => chooseMaterial(j, Number(event.target.value))}>
                                <option value="">{t("common.selectPlaceholder")}</option>
                                {materialUnavailable && <option value={option.packagingId}>{t("genericPackaging.form.unavailable", { name: material?.displayName ?? (savedNames?.materials.get(option.packagingId) || t("genericPackaging.material")) })}</option>}
                                {levelMaterials.filter(row => !takenElsewhere.has(row.id)).map(row => <option key={row.id} value={row.id}>{row.displayName}</option>)}
                            </Select>
                        </FormField>
                        <div className="min-w-0">
                            {group.level === "intermediate" && <p className="mb-5 text-sm text-ink-600 sm:mt-8">{t("genericPackaging.form.intermediateRule")}</p>}
                            {group.level === "unit" && <FormField label={t("genericPackaging.form.perUnitQuantity")} htmlFor={`quantity-${index}-${j}`} required>
                                <Input id={`quantity-${index}-${j}`} required type="number" min="0.01" step="0.01" value={option.quantityValue ?? ""} onChange={event => patchOption(j, { quantityValue: event.target.value ? Number(event.target.value) : null })} />
                            </FormField>}
                            {group.level === "pallet" && <div className="grid gap-x-3 sm:grid-cols-2">
                                <FormField label={t("genericPackaging.basis")} htmlFor={`basis-${index}-${j}`}>
                                    <Select id={`basis-${index}-${j}`} value={option.quantityBasis} onChange={event => patchOption(j, { quantityBasis: event.target.value as Group["options"][number]["quantityBasis"] })}>
                                        <option value="per_pallet">{t("genericPackaging.perPallet")}</option>
                                        <option value="per_box">{t("genericPackaging.perBox")}</option>
                                    </Select>
                                </FormField>
                                <FormField label={t("genericPackaging.quantity")} htmlFor={`quantity-${index}-${j}`} required>
                                    <Input id={`quantity-${index}-${j}`} required type="number" min="0.01" step="0.01" value={option.quantityValue ?? ""} onChange={event => patchOption(j, { quantityValue: event.target.value ? Number(event.target.value) : null })} />
                                </FormField>
                            </div>}
                        </div>
                        <button type="button" className={`${iconButton} sm:mt-7`} aria-label={t("genericPackaging.form.removeMaterial", { name: material?.displayName ?? t("genericPackaging.material") })} onClick={() => onChange({ options: group.options.filter((_, k) => k !== j) })}><Trash2 size={18} aria-hidden="true" /></button>
                    </div>
                    {group.level === "pallet" && material && (usesCatalogConsumption(option, material)
                        ? <p className="-mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-500"><Check size={14} aria-hidden="true" />{t("genericPackaging.form.catalogConsumption")}</p>
                        : !material.defaultQuantityBasis && <p className="-mt-3 text-xs text-ink-600">{t("genericPackaging.form.noCatalogConsumption")}</p>)}
                </li>;
            })}
        </ul>
        {!group.options.length && <p className="mb-3 text-sm text-ink-600">{t("genericPackaging.form.noMaterials")}</p>}
        <div className="mt-3 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => onChange({ options: [...group.options, newGenericOption(group.level)] })}><Plus size={16} aria-hidden="true" />{t("genericPackaging.addMaterial")}</Button>
            <Button variant="secondary" onClick={onCreateMaterial}>{t("genericPackaging.form.createMaterial")}</Button>
        </div>
    </div>;
}
