import { catalogDisplayName } from "@/shared/utils/catalogDisplayName";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import type { GenericAdminOptions, GenericSavedProfile } from "../schema/genericPackaging.schema";
import { GENERIC_LEVELS, groupUsage } from "../util/genericPackagingForm";
import { Card } from "@/shared/component/card.component";
import { Button } from "@/shared/component/button.component";
import { StatusBadge } from "@/shared/component/statusBadge.component";
import { statusPillClassName } from "@/shared/utils/statusPillClassName";
import { presentationDetails } from "@/feature/quote/util/quotePresentation.util";

type Props = { profiles: GenericSavedProfile[]; catalog: GenericAdminOptions | undefined; canEdit: boolean; canEditMaterials: boolean; onEdit: (profile: GenericSavedProfile) => void };

function quantityLabel(option: GenericSavedProfile["groups"][number]["options"][number], t: (key: string) => string) {
    if (option.quantityBasis === "per_intermediate") return t("genericPackaging.perIntermediate");
    const basis = { per_unit: "perUnit", per_box: "perBox", per_pallet: "perPallet" }[option.quantityBasis];
    return `${option.quantityValue ?? ""} ${t(`genericPackaging.${basis}`).toLocaleLowerCase()}`;
}

// Configured generic packaging, readable at a glance: readiness, logistics and materials by level and use.
export function GenericProfileList({ profiles, catalog, canEdit, canEditMaterials, onEdit }: Readonly<Props>) {
    const { t, i18n } = useTranslation();
    const language = i18n.resolvedLanguage ?? i18n.language;
    if (!profiles.length) return <Card><p className="text-ink-600">{t("genericPackaging.list.empty")}</p></Card>;
    return <div className="space-y-4">
        {profiles.map(profile => {
            const categoryRow = catalog?.categories.find(row => row.id === profile.categoryId);
            const category = categoryRow ? catalogDisplayName(categoryRow, language) : undefined;
            const presentation = catalog?.presentations.find(row => row.id === profile.presentationId)?.displayLabel;
            return <Card key={profile.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="break-words text-lg font-semibold text-ink-900">{profile.displayName}</h2>
                            <StatusBadge isActive={profile.isActive} />
                            <span className={statusPillClassName(profile.ready ? "success" : "warning")}>{t(profile.ready ? "genericPackaging.ready" : "genericPackaging.incomplete")}</span>
                        </div>
                        <p className="mt-1 text-sm text-ink-600">{[profile.reference, category, presentation].filter(Boolean).join(" · ")}</p>
                        <p className="text-sm text-ink-600">{presentationDetails(profile, t)}{profile.unitsPerIntermediatePackage ? ` · ${t("genericPackaging.list.intermediate", { count: profile.unitsPerIntermediatePackage })}` : ""}</p>
                    </div>
                    {canEdit && <Button variant="secondary" className="shrink-0" onClick={() => onEdit(profile)}><Pencil size={16} aria-hidden="true" />{t("common.edit")}</Button>}
                </div>
                {profile.issues.map((issue, i) => <p key={i} role="status" className="mt-3 rounded-lg border border-warning-border bg-warning-bg p-3 text-sm text-warning-fg">{t(issue.key, issue.params)}</p>)}
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {GENERIC_LEVELS.map(level => {
                        const groups = profile.groups.filter(group => group.level === level);
                        return <div key={level} className="min-w-0 rounded-xl bg-canvas p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-600">{t(`catalogQuote.ui.levels.${level}`)}</p>
                            {!groups.length && <p className="text-sm text-ink-600">—</p>}
                            <ul className="space-y-2">{groups.map((group, index) => <li key={index} className="text-sm">
                                <p className="font-medium text-ink-900">{group.group?.displayName ?? catalog?.groups.find(row => row.id === group.packagingGroupId)?.displayName ?? t("genericPackaging.group")}
                                    <span className="ml-1 font-normal text-ink-600">· {t(`genericPackaging.usagesShort.${groupUsage(group)}`)}</span></p>
                                <ul className="mt-1 space-y-0.5 text-ink-600">{group.options.map(option => <li key={option.packagingId} className="break-words">
                                    {option.packaging?.displayName ?? catalog?.materials.find(row => row.id === option.packagingId)?.displayName}
                                    <span className="text-ink-400"> · {quantityLabel(option, t)}</span>
                                    {canEditMaterials && <Link className="ml-2 text-focus underline" to={`/admin/packagings/${option.packagingId}/edit`}>{t("common.edit")}</Link>}
                                </li>)}</ul>
                            </li>)}</ul>
                        </div>;
                    })}
                </div>
            </Card>;
        })}
    </div>;
}
