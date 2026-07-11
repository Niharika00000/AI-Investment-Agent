import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/30",
        outline: "border-border text-muted-foreground",
        success: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
        warning: "border-transparent bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
        invest: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 font-bold",
        pass: "border-transparent bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/40 font-bold",
        neutral: "border-transparent bg-muted text-muted-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
