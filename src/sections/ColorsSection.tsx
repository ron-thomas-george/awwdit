import type { PageInsightsPayload } from "@/lib/messages";
import { Card } from "@/components/ui/card";

interface ColorsSectionProps {
  palette: PageInsightsPayload["colors"];
}

export function ColorsSection({ palette }: ColorsSectionProps) {
  return (
    <div className="space-y-3">
      {palette.map((swatch) => (
        <Card key={swatch.value} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white/80 p-3 shadow-none">
          <div
            className="h-12 w-12 rounded-xl border border-border"
            style={{ backgroundColor: swatch.value }}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>{swatch.value}</span>
              <span className="text-xs text-muted-foreground">{swatch.usage}% usage</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-purple-400"
                style={{ width: `${Math.min(100, swatch.usage)}%` }}
              />
            </div>
            {swatch.contrastOnWhite ? (
              <p className="mt-1 text-xs text-muted-foreground">Contrast vs white: {swatch.contrastOnWhite}</p>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
