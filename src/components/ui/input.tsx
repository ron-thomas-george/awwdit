import * as React from "react";

import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  unstyled?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", unstyled = false, ...props }, ref) => {
  const baseClasses = unstyled
    ? "flex w-full bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
    : "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return <input type={type} className={cn(baseClasses, className)} ref={ref} {...props} />;
});
Input.displayName = "Input";

export { Input };
