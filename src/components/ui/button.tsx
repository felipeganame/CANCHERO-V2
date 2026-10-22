import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "confirm" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-naranja text-[#2A0D13] hover:bg-naranja-strong",
  confirm: "bg-bordo text-white hover:bg-bordo-dark",
  ghost: "bg-transparent text-bordo border border-line hover:bg-bordo-soft",
  danger: "bg-danger text-white hover:opacity-90",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 font-bold tracking-tight transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
