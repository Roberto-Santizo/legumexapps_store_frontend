import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AlertTriangle, Check } from "lucide-react";
import { getPalletKitAPI } from "@/feature/palletKit/api/palletKit.api";
import { Card } from "@/shared/component/card.component";

// Status of the standard pallet kit, added to every quote; it is managed in its own section.
export function GenericPalletKitCard() {
    const { t } = useTranslation();
    const kit = useQuery({ queryKey: ["palletKit"], queryFn: getPalletKitAPI });
    if (!kit.data) return null;
    return <Card className={`mb-6 ${kit.data.complete ? "" : "border-warning-border bg-warning-bg"}`}>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
                <h2 className="font-semibold text-ink-900">{t("palletKit.title")}</h2>
                <p className="text-sm text-ink-600">{t(kit.data.complete ? "genericPackaging.kit.hint" : "genericPackaging.kit.missing")}</p>
            </div>
            <Link to="/admin/pallet-kit" className="text-sm font-semibold text-focus underline">{t("genericPackaging.kit.manage")}</Link>
        </div>
        <ul className="grid gap-2 sm:grid-cols-3">
            {kit.data.types.map(({ type, materials }) => <li key={type} className="flex min-w-0 items-start gap-2 rounded-xl bg-canvas p-3 text-sm">
                {materials.length ? <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-500" /> : <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-warning-fg" />}
                <span className="min-w-0">
                    <span className="block font-medium text-ink-900">{t(`packaging.consumption.types.${type}`)} · {t(`palletKit.quantity.${type}`)}</span>
                    {!materials.length && <span className="block text-ink-600">{t("genericPackaging.kit.notSet")}</span>}
                    {materials.map(material => <span key={material.id} className="block break-words text-ink-600">{material.displayName}</span>)}
                    {materials.length > 1 && <span className="mt-1 block text-xs font-medium text-focus">{t("palletKit.chosen")}</span>}
                </span>
            </li>)}
        </ul>
    </Card>;
}
