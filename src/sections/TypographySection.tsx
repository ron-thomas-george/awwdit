import { Card } from "@/components/ui/card";
import type { PageInsightsPayload } from "@/lib/messages";

interface TypographySectionProps {
  entries: PageInsightsPayload["typography"];
}

export function TypographySection({ entries }: TypographySectionProps) {
  if (!entries) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-foreground">Typography</h3>
      <TypographyCard label="Headings" value={entries.headings} />
      <TypographyCard label="Body" value={entries.body} />
    </div>
  );
}

function TypographyCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-2xl border border-border/70 px-4 py-3 shadow-none">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground" style={{ fontFamily: value }}>
        {value || "—"}
      </p>
    </Card>
  );
}
