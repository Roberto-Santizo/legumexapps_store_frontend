import { forwardRef } from "react"
import type { ButtonHTMLAttributes } from "react"
import type { ButtonVariant } from "@/shared/component/buttonClassName"
import { buttonClassName } from "@/shared/component/buttonClassName"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = "primary", className = "", ...props },
    ref
) {
    return <button ref={ref} type="button" className={buttonClassName(variant, className)} {...props} />
})
