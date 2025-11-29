import { Switch } from "./ui/switch";

interface InspectorHeaderProps {
  showHoverCard: boolean;
  onToggleHoverCard: (value: boolean) => void;
}

export function InspectorHeader({ showHoverCard, onToggleHoverCard }: InspectorHeaderProps) {
  return (
    <header className="rounded-2xl border border-border/70 bg-white/90 p-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-foreground">Show popover while hovering</p>
        <Switch checked={showHoverCard} onCheckedChange={onToggleHoverCard} aria-label="Toggle hover preview" />
      </div>
    </header>
  );
}
