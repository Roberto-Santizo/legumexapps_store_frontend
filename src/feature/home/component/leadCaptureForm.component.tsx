import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { AnimatePresence, motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { Send } from "lucide-react"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Textarea } from "@/shared/component/textarea.component"
import { Select } from "@/shared/component/select.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { leadCaptureSchema } from "@/feature/home/schema/leadCapture.schema"
import type { LeadCaptureInput } from "@/feature/home/schema/leadCapture.schema"
import { createLeadAPI } from "@/feature/lead/api/lead.api"
import { PRODUCT_LINES } from "@/feature/home/constant/productLines.constant"

export function LeadCaptureForm() {
    const { t } = useTranslation()
    const [isSubmitted, setIsSubmitted] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<LeadCaptureInput>({ resolver: zodResolver(leadCaptureSchema) })

    const createLeadMutation = useMutation({ mutationFn: createLeadAPI })

    async function onSubmit(data: LeadCaptureInput) {
        await createLeadMutation.mutateAsync(data)
        reset()
        setIsSubmitted(true)
    }

    if (isSubmitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex h-full flex-col items-center justify-center gap-5 py-16 text-center"
            >
                <svg width="72" height="72" viewBox="0 0 100 100" className="text-exito-fg">
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="44"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                    <motion.path
                        d="M29 52 L44 67 L73 34"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.55, duration: 0.45, ease: "easeOut" }}
                    />
                </svg>
                <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="font-display text-2xl font-extrabold uppercase tracking-tight text-verde-profundo"
                >
                    {t("home.leadCapture.successTitle")}
                </motion.h3>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="max-w-sm text-texto-suave"
                >
                    {t("home.leadCapture.successMessage")}
                </motion.p>
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className={buttonClassName("secondary")}
                >
                    {t("home.leadCapture.sendAnother")}
                </motion.button>
            </motion.div>
        )
    }

    return (
        <AnimatePresence mode="wait">
            <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit(onSubmit)}
                noValidate
            >
                <FormField label={t("home.leadCapture.form.name")} htmlFor="lead-fullName" error={errors.fullName?.message}>
                    <Input id="lead-fullName" preserveCase hasError={!!errors.fullName} {...register("fullName")} />
                </FormField>

                <FormField
                    label={t("home.leadCapture.form.companyName")}
                    htmlFor="lead-company"
                    error={errors.companyName?.message}
                >
                    <Input id="lead-company" preserveCase hasError={!!errors.companyName} {...register("companyName")} />
                </FormField>

                <div className="grid gap-x-4 sm:grid-cols-2">
                    <FormField label={t("home.leadCapture.form.email")} htmlFor="lead-email" error={errors.email?.message}>
                        <Input
                            id="lead-email"
                            type="email"
                            preserveCase
                            hasError={!!errors.email}
                            {...register("email")}
                        />
                    </FormField>

                    <FormField label={t("home.leadCapture.form.phone")} htmlFor="lead-phone" error={errors.phone?.message}>
                        <Input id="lead-phone" preserveCase hasError={!!errors.phone} {...register("phone")} />
                    </FormField>
                </div>

                <FormField label={t("home.leadCapture.form.productLineInterest")} htmlFor="lead-productLineInterest">
                    <Select id="lead-productLineInterest" defaultValue="" {...register("productLineInterest")}>
                        <option value="">{t("common.selectPlaceholder")}</option>
                        {PRODUCT_LINES.map((line) => (
                            <option key={line.id} value={t(`home.lines.items.${line.translationKey}.name`)}>
                                {t(`home.lines.items.${line.translationKey}.name`)}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField label={t("home.leadCapture.form.message")} htmlFor="lead-notes" error={errors.notes?.message}>
                    <Textarea id="lead-notes" preserveCase hasError={!!errors.notes} {...register("notes")} />
                </FormField>

                {/* Honeypot: invisible para una persona (fuera de pantalla, sin tabIndex, sin
                    autocompletar), pero un bot que rellena todos los inputs de un form sí lo
                    completa -- el backend lo usa para descartar el envío en silencio. */}
                <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute left-[-9999px] h-0 w-0 opacity-0"
                    {...register("website")}
                />

                <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`${buttonClassName("primary")} mt-2 w-full`}
                >
                    <Send size={16} />
                    {isSubmitting ? t("common.saving") : t("home.leadCapture.form.submit")}
                </motion.button>
            </motion.form>
        </AnimatePresence>
    )
}
