import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  selected,
}: {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white p-5",
        selected ? "border-2 border-bordo" : "border border-line",
        className,
      )}
    >
      {children}
    </div>
  );
}
