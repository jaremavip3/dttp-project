import * as React from "react"
import { Button as ShadcnButton } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const Button = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  asChild = false, 
  loading = false,
  children,
  disabled,
  ...props 
}, ref) => {
  return (
    <ShadcnButton
      ref={ref}
      className={cn(className)}
      variant={variant}
      size={size}
      asChild={asChild}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent">
            <span className="sr-only">Loading...</span>
          </div>
          {children}
        </>
      ) : (
        children
      )}
    </ShadcnButton>
  )
})
Button.displayName = "Button"

export { Button }
