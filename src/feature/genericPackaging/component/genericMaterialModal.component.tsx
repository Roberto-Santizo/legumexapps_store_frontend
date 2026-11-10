import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { createGenericMaterial } from "../api/genericPackaging.api";
import type { GenericLevel } from "../schema/genericPackaging.schema";
import { Modal } from "@/shared/component/modal.component";
import { FormField } from "@/shared/component/formField.component";
import { Input } from "@/shared/component/input.component";
import { Select } from "@/shared/component/select.component";
import { Button } from "@/shared/component/button.component";
import { showErrorToast } from "@/shared/i18n/showErrorToast";

const MATERIAL_TYPES = ["CAJA", "TARIMA", "ESQUINERO", "STRETCH", "OTRO"] as const;

// Quick creation of a generic material of one level, without leaving the configuration form.
// Pallet materials ask for their type, so the catalog keeps their consumption (corner boards 4, pallet 1...).
export function GenericMaterialModal({ level, onCreated, onClose }: Readonly<{ level: GenericLevel; onCreated: (packagingId: number) => void; onClose: () => void }>) {
    const { t } = useTranslation();
    const [values, setValues] = useState({ displayName: "", displayNameEn: "", unitCost: "", materialType: "", defaultQuantityBasis: "", defaultQuantityValue: "" });
    const [saving, setSaving] = useState(false);
    const set = (name: keyof typeof values) => (event: { target: { value: string } }) => setValues({ ...values, [name]: event.target.value });
    async function submit(event: React.FormEvent) {
        // The modal is portaled but still inside the configuration form's React tree.
        event.preventDefault(); event.stopPropagation();
        if (saving) return;
        setSaving(true);
        try {
            const response = await createGenericMaterial({ displayName: values.displayName, displayNameEn: values.displayNameEn, unitCost: Number(values.unitCost), packagingRole: level, classification: "generic",
                ...(level === "pallet" ? { materialType: values.materialType } : {}),
                ...(level === "pallet" && values.materialType === "OTRO" ? { defaultQuantityBasis: values.defaultQuantityBasis || null, defaultQuantityValue: values.defaultQuantityValue === "" ? null : Number(values.defaultQuantityValue) } : {}) });
            toast.success(response.message);
            onCreated(response.data.id);
        } catch (error) {
            showErrorToast(error as Error);
        } finally {
            setSaving(false);
        }
    }
    return <Modal title={t("genericPackaging.materialModal.title", { level: t(`catalogQuote.ui.levels.${level}`) })} onClose={onClose}>
        <form onSubmit={event => void submit(event)}>
            <p className="mb-5 text-sm text-ink-600">{t("genericPackaging.materialModal.hint")}</p>
            <FormField label={t("genericPackaging.displayName")} htmlFor="generic-material-name" required><Input id="generic-material-name" required value={values.displayName} onChange={set("displayName")} /></FormField>
            <FormField label={t("genericPackaging.displayNameEn")} htmlFor="generic-material-name-en" required><Input id="generic-material-name-en" required value={values.displayNameEn} onChange={set("displayNameEn")} /></FormField>
            <FormField label={t("genericPackaging.unitCost")} htmlFor="generic-material-cost" required><Input id="generic-material-cost" required type="number" min={0} step="0.000000000001" value={values.unitCost} onChange={set("unitCost")} /></FormField>
            {level === "pallet" && <>
                <FormField label={t("packaging.consumption.materialType")} htmlFor="generic-material-type" required>
                    <Select id="generic-material-type" required value={values.materialType} onChange={set("materialType")}>
                        <option value="">{t("packaging.consumption.chooseType")}</option>
                        {MATERIAL_TYPES.map(type => <option key={type} value={type}>{t(`packaging.consumption.types.${type}`)}</option>)}
                    </Select>
                </FormField>
                {values.materialType === "OTRO" && <>
                    <FormField label={t("packaging.consumption.basis")} htmlFor="generic-material-basis" required>
                        <Select id="generic-material-basis" required value={values.defaultQuantityBasis} onChange={set("defaultQuantityBasis")}>
                            <option value="">{t("common.selectPlaceholder")}</option>
                            <option value="per_box">{t("packaging.consumption.per_box")}</option>
                            <option value="per_pallet">{t("packaging.consumption.per_pallet")}</option>
                        </Select>
                    </FormField>
                    <FormField label={t("packaging.consumption.quantity")} htmlFor="generic-material-quantity" required>
                        <Input id="generic-material-quantity" required type="number" min="0.01" step="0.01" value={values.defaultQuantityValue} onChange={set("defaultQuantityValue")} />
                    </FormField>
                </>}
                <p className="mb-5 text-sm text-ink-600">{t("packaging.consumption.fixedHelp")}</p>
            </>}
            <div className="flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
                <Button variant="secondary" onClick={onClose}>{t("common.cancel")}</Button>
            </div>
        </form>
    </Modal>;
}
