import { forwardRef, type ComponentPropsWithoutRef } from "react"
import { Button as RadixButton } from "@radix-ui/themes"

type ButtonVariant = "primary" | "secondary" | "danger"
type ButtonSize = "default" | "compact"

type RadixButtonProps = ComponentPropsWithoutRef<typeof RadixButton>

type ButtonProps = Omit<RadixButtonProps, "color" | "size" | "variant"> & {
  fullWidth?: boolean
  size?: ButtonSize
  variant?: ButtonVariant
}

const VARIANT_PROPS: Record<
  ButtonVariant,
  Pick<RadixButtonProps, "color" | "variant">
> = {
  danger: { color: "red", variant: "soft" },
  primary: { color: "green", variant: "solid" },
  secondary: { color: "gray", variant: "soft" },
}

const SIZE_PROPS: Record<ButtonSize, RadixButtonProps["size"]> = {
  compact: "1",
  default: "2",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      fullWidth = false,
      size = "default",
      style,
      variant = "primary",
      ...props
    },
    ref,
  ) {
    return (
      <RadixButton
        {...VARIANT_PROPS[variant]}
        {...props}
        radius="large"
        ref={ref}
        size={SIZE_PROPS[size]}
        style={fullWidth ? { ...style, width: "100%" } : style}
      />
    )
  },
)
