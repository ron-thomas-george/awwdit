import { cn } from "@/lib/utils";
import { Switch } from "./ui/switch";

interface HoverCardToggleProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  className?: string;
}

export function HoverCardToggle({ enabled, onToggle, className }: HoverCardToggleProps) {
  return (
    <div className={cn("flex items-center justify-between rounded-2xl border border-dashed border-border px-4 py-3", className)}>
      <div>
        <p className="text-sm font-medium">Show popover while hovering</p>
        <p className="text-xs text-muted-foreground">Display element metadata near cursor.</p>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} aria-label="Toggle hover card" />
    </div>
  );
}
