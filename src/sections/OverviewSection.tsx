import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PageInsightsPayload } from "@/lib/messages";

interface OverviewSectionProps {
  overview: PageInsightsPayload["overview"];
  colors: PageInsightsPayload["colors"];
  typography?: PageInsightsPayload["typography"];
}

export function OverviewSection({ overview, colors, typography }: OverviewSectionProps) {
  return (
    <div className="space-y-4 w-full min-w-0">
      {overview.previewImage ? (
        <div className="w-full overflow-hidden rounded-3xl border border-border/70 bg-black shadow-sm">
          <img
            src={overview.previewImage}
            alt={overview.title}
            loading="lazy"
            className="block w-full object-contain"
          />
          <div className="relative px-4 pb-4">
            <span className="inline-flex rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
              Live preview
            </span>
          </div>
        </div>
      ) : null}

      <Card className="w-full border-none bg-gradient-to-br from-white to purple-50 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{overview.title || "Untitled page"}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            <a href={overview.url} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
              {overview.url}
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {overview.description ? <p className="text-muted-foreground">{overview.description}</p> : null}
          <div className="grid gap-4 rounded-2xl border border-border/60 bg-white/70 p-4">
            <Metric label="Headings" value={typography?.headings || overview.primaryFont || "auto"} />
            <Metric label="Body" value={typography?.body || overview.primaryFont || "auto"} />
            <Metric label="DOM nodes" value={overview.totalNodes.toLocaleString()} />
          </div>
        </CardContent>
      </Card>

      {colors?.length ? (
        <Card className="w-full border border-border/60 bg-white/95">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top colors</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Extracted from this page’s stylesheet</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {colors.slice(0, 5).map((swatch) => (
              <div key={swatch.value} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-2">
                <div
                  className="h-10 w-10 rounded-lg border border-border"
                  style={{ backgroundColor: swatch.value }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{swatch.value}</p>
                  <p className="text-xs text-muted-foreground">{swatch.usage}% of elements</p>
                </div>
                {swatch.contrastOnWhite ? (
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-muted-foreground">
                    {swatch.contrastOnWhite}
                  </span>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-base font-semibold text-foreground break-words">{value}</p>
    </div>
  );
}
