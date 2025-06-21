import * as React from "react";
import { cn } from "@/lib/utils";

const LoadingSpinner = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("animate-spin rounded-full border-2 border-current border-t-transparent", className)}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
});
LoadingSpinner.displayName = "LoadingSpinner";

export { LoadingSpinner };
