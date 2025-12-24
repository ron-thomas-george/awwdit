import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Copy } from "lucide-react";
import type { SelectedElementPayload } from "@/lib/messages";
import { parseSpacing, formatSpacing, type SpacingValues } from "@/lib/spacing";
import { rgbToHex } from "@/lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ElementControls } from "./element-controls";
import { Switch } from "./ui/switch";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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

const TEXTUAL_TAGS = new Set(["p", "span", "label", "a", "strong", "em", "small", "li", "h1", "h2", "h3", "h4", "h5", "h6"]);

export function SelectedElementView({ selectedElement, showHoverCard, onToggleHoverCard, onBack, onChange }: SelectedElementViewProps) {
  const { tag, selector, shortSelector, metrics, styles, textContent, summary } = selectedElement;
  const dimensionsLabel = `${metrics.width}px × ${metrics.height}px`;
  const colorSwatch = rgbToHex(styles.color ?? "#111111");
  const marginSpacing = parseSpacing(metrics.margin);
  const paddingSpacing = parseSpacing(metrics.padding);
  const getSpacingLabel = (value?: string) => {
    if (!value) return "0";
    const trimmed = value.trim();
    if (!trimmed) return "0";
    const pxMatch = trimmed.match(/^(-?[\d.]+)px$/i);
    if (pxMatch) {
      return pxMatch[1];
    }
    return trimmed;
  };
  const cleanSelector = (selector ?? "")
    .replace(new RegExp(`^${tag}`, "i"), "")
    .trim()
    .replace(/\s+>/g, " >");
  const heroLine = shortSelector || [tag, cleanSelector].filter(Boolean).join(" ");
  const isTextElement = TEXTUAL_TAGS.has(tag.toLowerCase());
  const textDescription = (summary?.trim() || textContent?.trim()) ?? "";
  const description = isTextElement
    ? textDescription || "No text content."
    : "This element wraps nested content.";
  const sectionLabel = isTextElement ? "Text" : "Element";
  const [showCopyToast, setShowCopyToast] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
    };
  }, []);

  const handleCopyTextColor = async () => {
    try {
      await navigator.clipboard.writeText(colorSwatch);
      setShowCopyToast(true);
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = window.setTimeout(() => {
        setShowCopyToast(false);
        toastTimeoutRef.current = null;
      }, 1600);
    } catch (error) {
      console.warn("Failed to copy color", error);
    }
  };

  return (
    <section className="flex h-full flex-col gap-4 relative">
      {showCopyToast && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-medium shadow-lg">
          Copied to clipboard
        </div>
      )}
      <Button variant="ghost" size="sm" className="w-fit px-2 text-sm" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to overview
      </Button>

      <ScrollArea className="h-full">
        <div className="space-y-4 px-1">
          <Card className="border border-border/70 bg-white/95">
            <CardHeader className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{sectionLabel}</p>
                <CardTitle className="text-2xl font-semibold break-all">
                  <span className="text-primary">{heroLine}</span>
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
              <div className="relative rounded-[32px] border border-dashed border-slate-200 bg-slate-50/80 p-6">
                <span className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 text-xs font-semibold text-muted-foreground">
                  {getSpacingLabel(marginSpacing.top)}
                </span>
                <span className="pointer-events-none absolute left-1/2 bottom-2 -translate-x-1/2 text-xs font-semibold text-muted-foreground">
                  {getSpacingLabel(marginSpacing.bottom)}
                </span>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  {getSpacingLabel(marginSpacing.left)}
                </span>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  {getSpacingLabel(marginSpacing.right)}
                </span>

                <div className="relative rounded-[26px] border border-border/60 bg-white/90 p-4 shadow-inner">
                  <span className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 text-xs font-semibold text-muted-foreground">
                    {getSpacingLabel(paddingSpacing.top)}
                  </span>
                  <span className="pointer-events-none absolute left-1/2 bottom-8 -translate-x-1/2 text-xs font-semibold text-muted-foreground">
                    {getSpacingLabel(paddingSpacing.bottom)}
                  </span>
                  <span className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    {getSpacingLabel(paddingSpacing.left)}
                  </span>
                  <span className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    {getSpacingLabel(paddingSpacing.right)}
                  </span>

                  <div className="mx-auto flex h-32 w-full max-w-sm items-center justify-center rounded-2xl border border-border/60 bg-white shadow-inner">
                    <span className="rounded-full bg-slate-900 px-4 py-1 text-sm font-semibold text-white">{dimensionsLabel}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg">Text properties</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                {PROPERTY_LABELS.map(({ label, accessor }) => (
                  <div key={accessor} className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground leading-snug">{label}</dt>
                    <dd className="font-medium text-foreground text-right leading-snug">{styles[accessor] || "—"}</dd>
                  </div>
                ))}
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Text color</dt>
                  <dd className="flex items-center gap-2 font-medium text-foreground">
                    <span className="h-5 w-5 rounded-md border border-border" style={{ backgroundColor: colorSwatch }} />
                    <span>{colorSwatch}</span>
                    <button
                      type="button"
                      className="rounded-md border border-border/80 p-1 hover:bg-slate-100"
                      onClick={handleCopyTextColor}
                      aria-label="Copy text color"
                    >
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg">Adjust typography</CardTitle>
            </CardHeader>
            <CardContent>
              <ElementControls selectedElement={selectedElement} onChange={onChange} />
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg">Adjust spacing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SpacingField
                label="Padding"
                value={styles.padding}
                onChange={(value, sides) =>
                  onChange({
                    padding: value,
                    paddingTop: sides.top,
                    paddingRight: sides.right,
                    paddingBottom: sides.bottom,
                    paddingLeft: sides.left
                  })
                }
              />
              <SpacingField
                label="Margin"
                value={styles.margin}
                onChange={(value, sides) =>
                  onChange({
                    margin: value,
                    marginTop: sides.top,
                    marginRight: sides.right,
                    marginBottom: sides.bottom,
                    marginLeft: sides.left
                  })
                }
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </section>
  );
}

interface SpacingFieldProps {
  label: string;
  value?: string;
  onChange: (formatted: string, sides: SpacingValues) => void;
}

type SpacingSide = "top" | "right" | "bottom" | "left";

function SpacingField({ label, value, onChange }: SpacingFieldProps) {
  const sides = parseSpacing(value);

  const handleSideChange = (side: SpacingSide, next: string) => {
    const updated: SpacingValues = { ...sides, [side]: next };
    const formatted = formatSpacing(updated);
    onChange(formatted, updated);
  };

  return (
    <div className="space-y-2.5">
      <p className="text-base font-semibold text-foreground">{label}</p>
      <div className="grid grid-cols-2 gap-4 md:gap-5">
        <SpacingNumberField label="Left" value={sides.left} onChange={(val) => handleSideChange("left", val)} />
        <SpacingNumberField label="Top" value={sides.top} onChange={(val) => handleSideChange("top", val)} />
        <SpacingNumberField label="Right" value={sides.right} onChange={(val) => handleSideChange("right", val)} />
        <SpacingNumberField label="Bottom" value={sides.bottom} onChange={(val) => handleSideChange("bottom", val)} />
      </div>
    </div>
  );
}

interface SpacingNumberFieldProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}

function SpacingNumberField({ label, value, onChange }: SpacingNumberFieldProps) {
  const numeric = value ? parseFloat(value) : NaN;
  const displayValue = Number.isFinite(numeric) ? numeric : "";
  return (
    <div className="w-full">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="mt-1 flex h-11 w-full items-center gap-2 rounded-xl border border-input bg-white px-3">
        <Input
          type="number"
          value={displayValue}
          onChange={(event) => {
            const next = event.target.value;
            onChange(next === "" ? "" : `${next}px`);
          }}
          unstyled
          className="h-full w-full border-0 px-0 text-base"
        />
        <span className="text-xs text-muted-foreground">px</span>
      </div>
    </div>
  );
}
