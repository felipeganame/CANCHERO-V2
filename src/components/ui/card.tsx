import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Card({
  children,
  className,
  selected,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  selected?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white p-5",
        selected ? "border-2 border-bordo" : "border border-line",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
