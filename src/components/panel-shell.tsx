import type { PropsWithChildren } from "react";
import { X } from "lucide-react";

interface PanelShellProps extends PropsWithChildren {
  onClose?: () => void;
}

export function PanelShell({ children, onClose }: PanelShellProps) {
  return (
    <div className="flex h-full w-full flex-col rounded-3xl border border-border/60 bg-white/95 text-sm text-foreground shadow-[0_25px_60px_rgba(15,23,42,0.25)]">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="text-base font-semibold text-foreground">Awwdit</div>
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
