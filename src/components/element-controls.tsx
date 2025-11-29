import { SelectedElementPayload } from "@/lib/messages";
import { rgbToHex } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface ElementControlsProps {
  selectedElement: SelectedElementPayload;
  onChange: (patch: SelectedElementPayload["styles"]) => void;
}

const FONT_OPTIONS = ["Inter", "Roboto", "Space Grotesk", "IBM Plex Sans", "Georgia", "Serif"];
const FONT_WEIGHTS = [
  { label: "Thin", value: "100" },
  { label: "Extra Light", value: "200" },
  { label: "Light", value: "300" },
  { label: "Regular", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Semibold", value: "600" },
  { label: "Bold", value: "700" },
  { label: "Black", value: "900" }
];

const TEXT_ALIGNMENTS: Array<{ label: string; value: SelectedElementPayload["styles"]["textAlign"] }> = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
  { label: "Justify", value: "justify" }
];

export function ElementControls({ selectedElement, onChange }: ElementControlsProps) {
  const { styles, metrics } = selectedElement;

  const handleChange = (field: keyof SelectedElementPayload["styles"], value: string) => {
    onChange({ ...styles, [field]: value });
  };

  const colorValue = rgbToHex(styles.color ?? "#000000");
  const backgroundValue = rgbToHex(styles.backgroundColor ?? "#ffffff");

  return (
    <Card className="border-border/70 bg-white/95">
      <CardHeader className="space-y-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Selected element</div>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold uppercase text-muted-foreground">
            {selectedElement.tag}
          </span>
          <span className="text-sm text-muted-foreground">{selectedElement.selector}</span>
        </CardTitle>
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <MetricBadge label="Width" value={`${metrics.width}px`} />
          <MetricBadge label="Height" value={`${metrics.height}px`} />
          <MetricBadge label="Font" value={styles.fontFamily?.split(",")[0] ?? "-"} />
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={["typography", "color"]} className="space-y-2">
          <AccordionItem value="typography">
            <AccordionTrigger className="text-sm font-semibold">Typography</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Typeface</Label>
                  <Select value={styles.fontFamily} onValueChange={(value) => handleChange("fontFamily", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Weight</Label>
                    <Select value={styles.fontWeight} onValueChange={(value) => handleChange("fontWeight", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Weight" />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHTS.map((weight) => (
                          <SelectItem key={weight.value} value={weight.value}>
                            {weight.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Align</Label>
                    <Select value={styles.textAlign} onValueChange={(value) => handleChange("textAlign", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Alignment" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEXT_ALIGNMENTS.map((align) => (
                          <SelectItem key={align.value} value={align.value}>
                            {align.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    label="Font size"
                    suffix="px"
                    value={styles.fontSize}
                    onChange={(value) => handleChange("fontSize", value)}
                  />
                  <NumberField
                    label="Line height"
                    suffix="px"
                    value={styles.lineHeight}
                    onChange={(value) => handleChange("lineHeight", value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    label="Letter spacing"
                    suffix="px"
                    value={styles.letterSpacing}
                    onChange={(value) => handleChange("letterSpacing", value)}
                  />
                  <Select value={styles.textTransform} onValueChange={(value) => handleChange("textTransform", value)}>
                    <SelectTrigger className="mt-6">
                      <SelectValue placeholder="Transform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="uppercase">Uppercase</SelectItem>
                      <SelectItem value="lowercase">Lowercase</SelectItem>
                      <SelectItem value="capitalize">Capitalize</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="color">
            <AccordionTrigger className="text-sm font-semibold">Fill & Background</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  label="Text color"
                  value={colorValue}
                  onChange={(value) => handleChange("color", value)}
                />
                <ColorField
                  label="Background"
                  value={backgroundValue}
                  onChange={(value) => handleChange("backgroundColor", value)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="spacing">
            <AccordionTrigger className="text-sm font-semibold">Spacing</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Padding"
                  suffix="px"
                  value={metrics.padding}
                  onChange={(value) => handleChange("padding" as keyof SelectedElementPayload["styles"], value)}
                />
                <NumberField
                  label="Margin"
                  suffix="px"
                  value={metrics.margin}
                  onChange={(value) => handleChange("margin" as keyof SelectedElementPayload["styles"], value)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-2 py-1 text-left">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: string;
  suffix?: string;
  onChange: (value: string) => void;
}

function NumberField({ label, value, suffix, onChange }: NumberFieldProps) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1 flex items-center gap-1 rounded-md border border-input bg-white/80 px-2 text-sm">
        <Input
          type="number"
          value={parseFloat(value) || 0}
          onChange={(event) => onChange(`${event.target.value}${suffix ?? ""}`)}
          className="border-0 px-0 py-1 text-sm focus-visible:ring-0"
        />
        {suffix ? <span className="text-xs text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  );
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 rounded-md border border-input bg-white/60 px-2 py-1">
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-10 cursor-pointer rounded-md border border-border bg-transparent"
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} className="border-0 px-0 py-1 text-sm focus-visible:ring-0" />
      </div>
    </div>
  );
}
