import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { getGenericProfiles, getGenericOptions, saveGenericProfile } from "../api/genericPackaging.api";
import { genericProfileSchema, type GenericProfileInput, type GenericSavedProfile } from "../schema/genericPackaging.schema";
import { emptyGenericProfile, savedNames, type SavedNames } from "../util/genericPackagingForm";
import { GenericImportCard } from "../component/genericImportCard.component";
import { GenericProfileForm } from "../component/genericProfileForm.component";
import { GenericProfileList } from "../component/genericProfileList.component";
import { GenericPalletKitCard } from "../component/genericPalletKitCard.component";
import { PageContainer } from "@/shared/component/pageContainer.component";
import { Button } from "@/shared/component/button.component";
import { Spinner } from "@/shared/component/spinner.component";
import { usePermission } from "@/shared/auth/usePermission";
import { showErrorToast } from "@/shared/i18n/showErrorToast";

// List of generic configurations; creating or editing opens the form in place of the list.
export function GenericPackagingPage() {
    const { t } = useTranslation();
    const client = useQueryClient();
    const { hasPermission } = usePermission();
    const profiles = useQuery({ queryKey: ["genericPackagingProfiles"], queryFn: getGenericProfiles });
    const catalog = useQuery({ queryKey: ["genericPackagingOptions"], queryFn: getGenericOptions });
    const [form, setForm] = useState<{ id?: number; value: GenericProfileInput; saved?: SavedNames } | null>(null);
    const [saving, setSaving] = useState(false);
    const canCreate = hasPermission("genericPackaging:create");
    const canEdit = hasPermission("genericPackaging:edit");
    const refresh = async () => {
        await Promise.all(["genericPackagingProfiles", "catalogQuoteDiscovery", "adminCatalogQuoteDiscovery"].map(key => client.invalidateQueries({ queryKey: [key] })));
        await client.invalidateQueries({ queryKey: ["genericPackagingOptions"] });
    };
    const open = (value: { id?: number; value: GenericProfileInput; saved?: SavedNames }) => { setForm(value); window.scrollTo({ top: 0, behavior: "smooth" }); };
    async function save() {
        if (!form || saving) return;
        setSaving(true);
        try {
            const response = await saveGenericProfile(genericProfileSchema.parse(form.value), form.id);
            toast.success(response?.message ?? t("genericPackaging.saved"));
            setForm(null);
            await refresh();
        } catch (error) {
            showErrorToast(error as Error);
        } finally {
            setSaving(false);
        }
    }
    if (profiles.isLoading || catalog.isLoading) return <PageContainer><Spinner /></PageContainer>;
    if (profiles.isError || catalog.isError || !catalog.data) return <PageContainer><p role="alert" className="text-danger">{t("common.loadError")}</p></PageContainer>;
    const catalogData = catalog.data;
    return <PageContainer wide>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-ink-900">{form ? t(form.id ? "genericPackaging.edit" : "genericPackaging.new") : t("genericPackaging.title")}</h1>
                <p className="mt-1 max-w-3xl text-ink-600">{t(form ? "genericPackaging.form.intro" : "genericPackaging.hint")}</p>
            </div>
            {!form && canCreate && <Button className="shrink-0" onClick={() => open({ value: emptyGenericProfile() })}><Plus size={16} aria-hidden="true" />{t("genericPackaging.new")}</Button>}
            {form && <Button variant="secondary" className="shrink-0" onClick={() => setForm(null)}>{t("genericPackaging.form.backToList")}</Button>}
        </div>
        {form
            ? <GenericProfileForm value={form.value} catalog={catalogData} savedNames={form.saved} editing={!!form.id} saving={saving}
                onChange={next => setForm(current => current && { ...current, value: typeof next === "function" ? next(current.value) : next })}
                onSubmit={() => void save()} onCancel={() => setForm(null)}
                onMaterialCreated={async () => { await refresh(); return client.getQueryData(["genericPackagingOptions"]); }} />
            : <>
                {hasPermission("palletKit:view") && <GenericPalletKitCard />}
                {canCreate && <GenericImportCard onImported={refresh} />}
                <GenericProfileList profiles={profiles.data ?? []} catalog={catalogData} canEdit={canEdit} canEditMaterials={hasPermission("packagings:edit")}
                    onEdit={(profile: GenericSavedProfile) => open({ id: profile.id, value: genericProfileSchema.parse(profile), saved: savedNames(profile) })} />
            </>}
    </PageContainer>;
}
