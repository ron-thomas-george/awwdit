import type { PageInsightsPayload } from "@/lib/messages";
import { rgbToHex } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface ColorsSectionProps {
  palette: PageInsightsPayload["colors"];
}

export function ColorsSection({ palette }: ColorsSectionProps) {
  return (
    <div className="space-y-3">
      {palette.map((swatch) => {
        const hexValue = rgbToHex(swatch.value);
        return (
        <Card key={swatch.value} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white/80 p-3 shadow-none">
          <div
            className="h-12 w-12 rounded-xl border border-border"
            style={{ backgroundColor: hexValue }}
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{hexValue}</p>
            <p className="mt-1 text-xs text-muted-foreground">{swatch.usage}% usage</p>
            {swatch.contrastOnWhite ? (
              <p className="mt-2 text-xs text-muted-foreground">Contrast vs white: {swatch.contrastOnWhite}</p>
            ) : null}
          </div>
        </Card>
      );})}
    </div>
  );
}
