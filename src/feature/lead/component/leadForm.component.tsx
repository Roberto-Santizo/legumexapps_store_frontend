import type { FieldErrors, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateLeadInput } from "@/feature/lead/schema/lead.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Select } from "@/shared/component/select.component"
import { Textarea } from "@/shared/component/textarea.component"

type LeadFormProps = {
    register: UseFormRegister<UpdateLeadInput>
    errors: FieldErrors<UpdateLeadInput>
}

// Solo status/notas son editables -- el resto del lead (nombre, empresa, teléfono, correo,
// línea de interés) lo mandó el prospecto desde la landing y se muestra de solo lectura en
// editLead.page.tsx, no forma parte de este form.
export function LeadForm({ register, errors }: Readonly<LeadFormProps>) {
    const { t } = useTranslation()

    return (
        <div>
            <FormField label={t("common.status")} htmlFor="status" error={getFieldErrorMessage(t, errors.status)}>
                <Select id="status" hasError={!!errors.status} {...register("status")}>
                    <option value="new">{t("lead.form.statusOptions.new")}</option>
                    <option value="contacted">{t("lead.form.statusOptions.contacted")}</option>
                </Select>
            </FormField>

            <FormField label={t("lead.form.notes")} htmlFor="notes" error={getFieldErrorMessage(t, errors.notes)}>
                <Textarea id="notes" preserveCase hasError={!!errors.notes} {...register("notes")} />
            </FormField>
        </div>
    )
}
