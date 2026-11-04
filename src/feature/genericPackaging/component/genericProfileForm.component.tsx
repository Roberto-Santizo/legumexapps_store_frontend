import { catalogDisplayName } from "@/shared/utils/catalogDisplayName";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { GenericAdminOptions, GenericLevel, GenericProfileInput } from "../schema/genericPackaging.schema";
import { GENERIC_LEVELS, catalogAvailability, genericFormProblems, newGenericGroup, newGenericOption, withCatalogConsumption, type SavedNames } from "../util/genericPackagingForm";
import { GenericGroupCard } from "./genericGroupCard.component";
import { GenericMaterialModal } from "./genericMaterialModal.component";
import { Card } from "@/shared/component/card.component";
import { FormField } from "@/shared/component/formField.component";
import { Input } from "@/shared/component/input.component";
import { Select } from "@/shared/component/select.component";
import { SearchableSelect } from "@/shared/component/searchableSelect.component";
import { Button } from "@/shared/component/button.component";
import { Checkbox } from "@/shared/component/checkbox.component";

type Props = {
    value: GenericProfileInput;
    // Takes an updater too, for changes applied after an await (the value may have changed meanwhile).
    onChange: (value: GenericProfileInput | ((current: GenericProfileInput) => GenericProfileInput)) => void;
    catalog: GenericAdminOptions;
    savedNames?: SavedNames;
    editing: boolean;
    saving: boolean;
    onSubmit: () => void;
    onCancel: () => void;
    onMaterialCreated: () => Promise<GenericAdminOptions | undefined>;
};

function Section({ number, title, hint, children }: Readonly<{ number: number; title: string; hint: string; children: ReactNode }>) {
    return <Card className="mb-5">
        <div className="mb-5 flex items-start gap-3">
            <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">{number}</span>
            <div className="min-w-0"><h2 className="text-lg font-semibold text-ink-900">{title}</h2><p className="text-sm text-ink-600">{hint}</p></div>
        </div>
        {children}
    </Card>;
}

export function GenericProfileForm({ value, onChange, catalog, savedNames, editing, saving, onSubmit, onCancel, onMaterialCreated }: Readonly<Props>) {
    const { t, i18n } = useTranslation();
    const language = i18n.resolvedLanguage ?? i18n.language;
    const [problems, setProblems] = useState<string[]>([]);
    const [materialFor, setMaterialFor] = useState<{ level: GenericLevel; groupIndex: number } | null>(null);
    const set = (patch: Partial<GenericProfileInput>) => onChange({ ...value, ...patch });
    const patchGroup = (index: number, patch: Partial<GenericProfileInput["groups"][number]>) => set({ groups: value.groups.map((group, i) => i === index ? { ...group, ...patch } : group) });
    const number = (raw: string) => raw ? Number(raw) : null;
    const unitsPerPallet = value.bagsPerBox > 0 && value.boxesPerPallet > 0 ? value.bagsPerBox * value.boxesPerPallet : null;
    function submit(event: React.FormEvent) {
        event.preventDefault();
        const found = genericFormProblems(value, {
            group: id => catalog.groups.find(row => row.id === id)?.displayName ?? savedNames?.groups.get(id) ?? "",
            material: id => catalog.materials.find(row => row.id === id)?.displayName ?? savedNames?.materials.get(id) ?? "",
            level: level => t(`catalogQuote.ui.levels.${level}`),
        }, catalogAvailability(catalog)).map(problem => t(`genericPackaging.problems.${problem.key}`, problem.params));
        setProblems(found);
        if (!found.length) onSubmit();
    }
    async function materialCreated(packagingId: number) {
        const target = materialFor;
        setMaterialFor(null);
        const options = await onMaterialCreated();
        if (!target) return;
        const material = options?.materials.find(row => row.id === packagingId);
        // Add the new material to the group that asked for it, with its catalog consumption, on the current
        // value: anything edited while the catalog reloaded is kept.
        onChange(current => ({ ...current, groups: current.groups.map((group, i) => i !== target.groupIndex ? group
            : { ...group, options: [...group.options.filter(option => option.packagingId), withCatalogConsumption(newGenericOption(group.level, packagingId), group.level, material)] }) }));
    }
    const unavailable = (name: string | undefined) => t("genericPackaging.form.unavailable", { name: name ?? "" });
    const categoryUnavailable = !!value.categoryId && !catalog.categories.some(row => row.id === value.categoryId);
    const presentationOptions = catalog.presentations.map(row => ({ value: row.id, label: row.displayLabel }));
    if (value.presentationId && !presentationOptions.some(option => option.value === value.presentationId)) presentationOptions.unshift({ value: value.presentationId, label: unavailable(savedNames?.presentation) });
    return <form onSubmit={submit} noValidate>
        <fieldset disabled={saving} className="min-w-0">
            <Section number={1} title={t("genericPackaging.form.generalTitle")} hint={t("genericPackaging.form.generalHint")}>
                <div className="grid gap-x-5 sm:grid-cols-2">
                    <FormField label={t("genericPackaging.displayName")} htmlFor="generic-displayName" required>
                        <Input id="generic-displayName" value={value.displayName} placeholder={t("genericPackaging.form.displayNamePlaceholder")} onChange={event => set({ displayName: event.target.value })} />
                    </FormField>
                    <FormField label={t("genericPackaging.reference")} htmlFor="generic-reference" required>
                        <Input id="generic-reference" value={value.reference} placeholder={t("genericPackaging.form.referencePlaceholder")} onChange={event => set({ reference: event.target.value })} />
                    </FormField>
                    <FormField label={t("genericPackaging.category")} htmlFor="generic-category" required>
                        <Select id="generic-category" value={value.categoryId || ""} onChange={event => set({ categoryId: Number(event.target.value) })}>
                            <option value="">{t("common.selectPlaceholder")}</option>
                            {categoryUnavailable && <option value={value.categoryId}>{unavailable(savedNames?.category)}</option>}
                            {catalog.categories.map(row => <option key={row.id} value={row.id}>{catalogDisplayName(row, language)}</option>)}
                        </Select>
                    </FormField>
                    <FormField label={t("genericPackaging.presentation")} htmlFor="generic-presentation" required>
                        {/* Searchable: the presentation catalog is long. react-select ignores the fieldset's disabled, so it gets isDisabled. */}
                        <SearchableSelect inputId="generic-presentation" options={presentationOptions} value={presentationOptions.find(option => option.value === value.presentationId) ?? null}
                            onChange={option => set({ presentationId: option?.value ?? 0 })} isClearable isDisabled={saving}
                            placeholder={t("common.searchPlaceholder")} noOptionsMessage={() => t("common.noOptionsFound")} />
                    </FormField>
                </div>
                <Checkbox id="generic-active" label={t("genericPackaging.form.activeLabel")} checked={value.isActive} onChange={event => set({ isActive: event.target.checked })} className="-mx-3" />
            </Section>

            <Section number={2} title={t("genericPackaging.form.logisticsTitle")} hint={t("genericPackaging.form.logisticsHint")}>
                <div className="grid gap-x-5 sm:grid-cols-3">
                    <FormField label={t("genericPackaging.boxesPerPallet")} htmlFor="generic-boxesPerPallet" required>
                        <Input id="generic-boxesPerPallet" type="number" min={1} step={1} value={value.boxesPerPallet || ""} onChange={event => set({ boxesPerPallet: Number(event.target.value) })} />
                    </FormField>
                    <FormField label={t("genericPackaging.bagsPerBox")} htmlFor="generic-bagsPerBox" required>
                        <Input id="generic-bagsPerBox" type="number" min={1} step={1} value={value.bagsPerBox || ""} onChange={event => set({ bagsPerBox: Number(event.target.value) })} />
                    </FormField>
                    <FormField label={t("genericPackaging.unitsPerIntermediatePackage")} htmlFor="generic-unitsPerIntermediatePackage">
                        <Input id="generic-unitsPerIntermediatePackage" type="number" min={1} step={1} value={value.unitsPerIntermediatePackage ?? ""} onChange={event => set({ unitsPerIntermediatePackage: number(event.target.value) })} />
                    </FormField>
                </div>
                <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-ink-600">{t("genericPackaging.form.intermediateHint")}</p>
                    {unitsPerPallet && <p className="shrink-0 rounded-full bg-customize-mint px-3 py-1 font-semibold text-brand-700 dark:text-brand-500">{t("genericPackaging.form.unitsPerPallet", { count: unitsPerPallet })}</p>}
                </div>
            </Section>

            <Section number={3} title={t("genericPackaging.form.materialsTitle")} hint={t("genericPackaging.form.materialsHint")}>
                <div className="space-y-6">
                    {GENERIC_LEVELS.map(level => {
                        const entries = value.groups.map((group, index) => ({ group, index })).filter(entry => entry.group.level === level);
                        return <section key={level} aria-labelledby={`level-${level}`} className="rounded-xl border border-line bg-canvas/60 p-4">
                            <h3 id={`level-${level}`} className="font-semibold text-ink-900">{t(`catalogQuote.ui.levels.${level}`)}</h3>
                            <p className="mb-4 text-sm text-ink-600">{t(`site.quoteRequest.form.wizard.materials.levelHints.${level}`)}</p>
                            <div className="space-y-4">
                                {entries.map(({ group, index }) => <GenericGroupCard key={index} group={group} index={index} catalog={catalog} savedNames={savedNames} disabled={saving}
                                    onChange={patch => patchGroup(index, patch)}
                                    onRemove={() => set({ groups: value.groups.filter((_, i) => i !== index) })}
                                    onCreateMaterial={() => setMaterialFor({ level, groupIndex: index })} />)}
                            </div>
                            {!entries.length && <p className="mb-3 text-sm text-ink-600">{t("genericPackaging.form.emptyLevel")}</p>}
                            <Button variant="secondary" className="mt-4" onClick={() => set({ groups: [...value.groups, newGenericGroup(level)] })}><Plus size={16} aria-hidden="true" />{t("genericPackaging.addGroup")}</Button>
                        </section>;
                    })}
                </div>
            </Section>

            {problems.length > 0 && <div role="alert" className="mb-5 rounded-panel border border-danger-border bg-danger-bg p-4 text-sm text-danger">
                <p className="mb-2 font-semibold">{t("genericPackaging.form.problemsTitle")}</p>
                <ul className="list-disc space-y-1 pl-5">{problems.map((problem, i) => <li key={i}>{problem}</li>)}</ul>
            </div>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={onCancel}>{t("common.cancel")}</Button>
                <Button type="submit">{saving ? t("common.saving") : t(editing ? "genericPackaging.form.saveChanges" : "genericPackaging.new")}</Button>
            </div>
        </fieldset>
        {materialFor && <GenericMaterialModal level={materialFor.level} onCreated={id => void materialCreated(id)} onClose={() => setMaterialFor(null)} />}
    </form>;
}
