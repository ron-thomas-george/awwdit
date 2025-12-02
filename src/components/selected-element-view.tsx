import { ArrowLeft, Layers } from "lucide-react";
import type { SelectedElementPayload } from "@/lib/messages";
import { rgbToHex } from "@/lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ElementControls } from "./element-controls";
import { Switch } from "./ui/switch";
import { ScrollArea } from "./ui/scroll-area";

interface SelectedElementViewProps {
  selectedElement: SelectedElementPayload;
  showHoverCard: boolean;
  onToggleHoverCard: (next: boolean) => void;
  onBack: () => void;
  onChange: (styles: Partial<SelectedElementPayload["styles"]>) => void;
}

const PROPERTY_LABELS: Array<{ label: string; accessor: keyof SelectedElementPayload["styles"]; suffix?: string }> = [
  { label: "Font Family", accessor: "fontFamily" },
  { label: "Font Size", accessor: "fontSize" },
  { label: "Line Height", accessor: "lineHeight" },
  { label: "Font Weight", accessor: "fontWeight" },
  { label: "Letter Spacing", accessor: "letterSpacing" },
  { label: "Text Transform", accessor: "textTransform" }
];

export function SelectedElementView({ selectedElement, showHoverCard, onToggleHoverCard, onBack, onChange }: SelectedElementViewProps) {
  const { tag, selector, metrics, styles, textContent, summary } = selectedElement;
  const dimensionsLabel = `${metrics.width}px × ${metrics.height}px`;
  const colorSwatch = rgbToHex(styles.color ?? "#111111");
  const cleanSelector = (selector ?? "")
    .replace(new RegExp(`^${tag}`, "i"), "")
    .trim()
    .replace(/\s+>/g, " >");
  const heroLine = [tag, cleanSelector].filter(Boolean).join(" ");
  const description = summary?.trim() || textContent?.trim() || "No text content.";

  return (
    <section className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="w-fit px-2 text-sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to overview
        </Button>
        <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
          <Layers className="h-3 w-3 text-primary" /> {tag}
        </div>
      </div>

      <ScrollArea className="h-full">
        <div className="space-y-4 px-1">
          <Card className="border border-border/70 bg-white/95">
          <CardHeader className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Text</p>
              <CardTitle className="text-2xl font-semibold">
                <span className="text-primary">{tag}</span>
                {cleanSelector ? <span className="ml-2 text-muted-foreground break-all">{cleanSelector}</span> : null}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground line-clamp-3">{description}</CardDescription>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Context menu while hovering</p>
                <p className="text-xs text-muted-foreground">Show hover inspector on the page</p>
              </div>
              <Switch checked={showHoverCard} onCheckedChange={onToggleHoverCard} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-6">
              <div className="mx-auto flex h-32 w-full max-w-sm items-center justify-center rounded-2xl bg-white shadow-inner">
                <span className="rounded-full bg-slate-900 px-4 py-1 text-sm font-semibold text-white">{dimensionsLabel}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">Text properties</p>
              <dl className="mt-4 space-y-3 text-sm">
                {PROPERTY_LABELS.map(({ label, accessor }) => (
                  <div key={accessor} className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground leading-snug">{label}</dt>
                    <dd className="font-medium text-foreground text-right leading-snug">{styles[accessor] || "—"}</dd>
                  </div>
                ))}
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Text color</dt>
                  <dd className="flex items-center gap-2 font-medium text-foreground">
                    <span
                      className="h-5 w-5 rounded-md border border-border"
                      style={{ backgroundColor: colorSwatch }}
                    />
                    {colorSwatch}
                  </dd>
                </div>
              </dl>
            </div>
          </CardContent>
          </Card>

          <Card className="border border-border/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg">Adjust typography</CardTitle>
              <CardDescription>Update the selected element and see changes live on the page.</CardDescription>
            </CardHeader>
            <CardContent>
              <ElementControls selectedElement={selectedElement} onChange={onChange} />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </section>
  );
}
