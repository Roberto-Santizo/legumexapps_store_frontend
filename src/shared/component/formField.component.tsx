import type { ReactElement, ReactNode } from "react"
import { cloneElement, isValidElement } from "react"
import { Label } from "@/shared/component/label.component"
import { FieldError } from "@/shared/component/fieldError.component"

type FormFieldProps = {
    label: string
    htmlFor: string
    error?: string
    /** Whether the field is required per its zod schema — drives the red asterisk next to the label. */
    required?: boolean
    children: ReactNode
}

// Best-effort: only a single form-control child can be marked aria-required; components that
// don't accept/forward that prop simply ignore it at runtime, so this is always safe to try.
function withAriaRequired(children: ReactNode, required: boolean): ReactNode {
    if (!required || !isValidElement(children)) return children
    return cloneElement(children as ReactElement<Record<string, unknown>>, { "aria-required": true })
}

export function FormField({ label, htmlFor, error, required = false, children }: Readonly<FormFieldProps>) {
    return (
        <div className="mb-5">
            <Label htmlFor={htmlFor}>
                {label}
                {required && (
                    <span className="ml-0.5 text-danger" aria-hidden="true">
                        *
                    </span>
                )}
            </Label>
            {withAriaRequired(children, required)}
            <FieldError>{error}</FieldError>
        </div>
    )
}
