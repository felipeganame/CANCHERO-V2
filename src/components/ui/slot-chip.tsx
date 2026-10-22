import { cn } from "@/lib/cn";

export type SlotState = "free" | "busy" | "selected";

const stateClasses: Record<SlotState, string> = {
  free: "border border-line bg-white text-ink hover:border-bordo",
  busy: "border border-line bg-busy-soft text-busy cursor-not-allowed line-through",
  selected: "border-2 border-bordo bg-bordo text-white",
};

export function SlotChip({
  time,
  state,
  onClick,
}: {
  time: string;
  state: SlotState;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={state === "busy"}
      onClick={onClick}
      aria-pressed={state === "selected"}
      className={cn(
        "min-h-11 min-w-16 rounded-xl px-3 text-sm font-semibold tabular-nums transition-colors",
        stateClasses[state],
      )}
    >
      {time}
    </button>
  );
}
