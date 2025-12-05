import { type PropsWithChildren, useCallback } from "react";
import { GripVertical, X } from "lucide-react";

interface PanelShellProps extends PropsWithChildren {
  onClose?: () => void;
}

export function PanelShell({ children, onClose }: PanelShellProps) {
  const postDragMessage = useCallback(
    (phase: "start" | "move" | "end", coords: { clientX: number; clientY: number; screenX: number; screenY: number; pointerId?: number }) => {
      if (typeof window === "undefined") return;
      if (!window.parent || window.parent === window) return;
      window.parent.postMessage(
        {
          __awwditDrag: true,
          phase,
          clientX: coords.clientX,
          clientY: coords.clientY,
          screenX: coords.screenX,
          screenY: coords.screenY,
          pointerId: coords.pointerId
        },
        "*"
      );
    },
    []
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (typeof window === "undefined") return;
      if (!window.parent || window.parent === window) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      postDragMessage("start", event);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        postDragMessage("move", moveEvent);
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        postDragMessage("end", upEvent);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [postDragMessage]
  );

  return (
    <div className="flex h-full w-full flex-col rounded-3xl border border-border/60 bg-white/95 text-sm text-foreground shadow-[0_25px_60px_rgba(15,23,42,0.25)]">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <button
          type="button"
          onPointerDown={handlePointerDown}
          aria-label="Drag inspector"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-muted-foreground transition hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:cursor-grabbing cursor-grab"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:border-border hover:text-foreground"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="flex-1 overflow-hidden p-4">{children}</div>
    </div>
  );
}
