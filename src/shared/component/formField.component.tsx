import type { ReactNode } from "react"
import { Label } from "@/shared/component/label.component"
import { FieldError } from "@/shared/component/fieldError.component"

type FormFieldProps = {
    label: string
    htmlFor: string
    error?: string
    children: ReactNode
}

export function FormField({ label, htmlFor, error, children }: Readonly<FormFieldProps>) {
    return (
        <div className="mb-5">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            <FieldError>{error}</FieldError>
        </div>
    )
}
