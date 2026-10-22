import { cn } from "@/lib/cn";

type BadgeTone = "ok" | "danger" | "busy" | "naranja";

const toneClasses: Record<BadgeTone, string> = {
  ok: "bg-ok-soft text-ok",
  danger: "bg-danger-soft text-danger",
  busy: "bg-busy-soft text-busy",
  naranja: "bg-naranja-soft text-naranja-text",
};

export function Badge({
  tone,
  children,
  className,
}: {
  tone: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
