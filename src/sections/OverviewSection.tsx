import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PageInsightsPayload } from "@/lib/messages";

interface OverviewSectionProps {
  overview: PageInsightsPayload["overview"];
  colors: PageInsightsPayload["colors"];
  typography?: PageInsightsPayload["typography"];
}

export function OverviewSection({ overview, colors, typography }: OverviewSectionProps) {
  return (
    <div className="space-y-3 w-full min-w-0">
      <div className="space-y-1">
        {overview.previewImage ? (
          <div className="relative mb-1 w-full overflow-hidden rounded-lg border border-border/70 bg-black shadow-sm">
            <div className="flex h-36 w-full items-center justify-center bg-black">
              <img
                src={overview.previewImage}
                alt={overview.title}
                loading="lazy"
                className="block h-full w-full object-cover"
              />
            </div>
          </div>
        ) : null}

        <Card className="w-full border-none bg-gradient-to-br from-white to purple-50 shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="text-lg font-semibold">{overview.title || "Untitled page"}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              <a href={overview.url} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
                {overview.url}
              </a>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {typography ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Typography</h3>
          <div className="space-y-2">
            <TypographyPill label="Headings" value={typography.headings || overview.primaryFont || "auto"} />
            <TypographyPill label="Body" value={typography.body || overview.primaryFont || "auto"} />
          </div>
        </section>
      ) : null}

      {colors?.length ? (
        <section className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Top colors</h3>
            <p className="text-xs text-muted-foreground">Extracted from this page’s stylesheet</p>
          </div>
          <div className="space-y-2">
            {colors.slice(0, 5).map((swatch) => (
              <ColorPill key={swatch.value} value={swatch.value} usage={swatch.usage} contrast={swatch.contrastOnWhite} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

interface TypographyPillProps {
  label: string;
  value: string;
}

function TypographyPill({ label, value }: TypographyPillProps) {
  return (
    <Card className="rounded-2xl border border-border/70 bg-white/90 px-4 py-3 shadow-none">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-base font-semibold text-foreground">
        {value || "—"}
      </p>
    </Card>
  );
}

interface ColorPillProps {
  value: string;
  usage: number;
  contrast?: string;
}

function ColorPill({ value, usage, contrast }: ColorPillProps) {
  return (
    <Card className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white/90 px-3 py-2 shadow-none">
      <div className="h-10 w-10 rounded-xl border border-border" style={{ backgroundColor: value }} />
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm font-medium text-foreground">
          <span className="truncate">{value}</span>
          <span className="text-xs text-muted-foreground">{usage}% usage</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-purple-400" style={{ width: `${Math.min(100, usage)}%` }} />
        </div>
        {contrast ? <p className="mt-1 text-xs text-muted-foreground">Contrast vs white: {contrast}</p> : null}
      </div>
    </Card>
  );
}
