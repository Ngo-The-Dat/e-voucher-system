import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:opacity-90 shadow-sm",
        destructive: "bg-error text-on-error hover:opacity-90 shadow-sm",
        outline: "border border-outline-variant bg-transparent hover:bg-surface-container-low text-on-surface",
        secondary: "bg-secondary-container text-on-secondary-container hover:opacity-90",
        ghost: "hover:bg-surface-container hover:text-on-surface",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 text-label-md",
        sm: "h-9 rounded-md px-3 text-label-sm",
        lg: "h-12 rounded-lg px-8 text-label-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }))
    const content = (
      <>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </>
    )

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{
        className?: string
        children?: React.ReactNode
      }>

      return React.cloneElement(child, {
        className: cn(classes, child.props.className),
        children: (
          <>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {child.props.children}
          </>
        ),
      })
    }

    return (
      <button
        className={classes}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {content}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
