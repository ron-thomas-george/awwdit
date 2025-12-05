import { SelectedElementPayload } from "@/lib/messages";
import { formatSpacing, parseSpacing } from "@/lib/spacing";
import { rgbToHex } from "@/lib/utils";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface ElementControlsProps {
  selectedElement: SelectedElementPayload;
  onChange: (patch: Partial<SelectedElementPayload["styles"]>) => void;
}

interface SpacingFieldProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}

type SpacingSide = "top" | "right" | "bottom" | "left";

function SpacingField({ label, value, onChange }: SpacingFieldProps) {
  const sides = parseSpacing(value);

  const handleSideChange = (side: SpacingSide, next: string) => {
    const updated = { ...sides, [side]: next };
    const formatted = formatSpacing(updated);
    onChange(formatted);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Left" value={sides.left} onChange={(val) => handleSideChange("left", val)} />
        <NumberField label="Top" value={sides.top} onChange={(val) => handleSideChange("top", val)} />
        <NumberField label="Right" value={sides.right} onChange={(val) => handleSideChange("right", val)} />
        <NumberField label="Bottom" value={sides.bottom} onChange={(val) => handleSideChange("bottom", val)} />
      </div>
    </div>
  );
}

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
  const { styles } = selectedElement;

  const handleChange = (field: keyof SelectedElementPayload["styles"], value: string) => {
    onChange({ [field]: value });
  };

  const colorValue = rgbToHex(styles.color ?? "#111111");
  const backgroundValue = rgbToHex(styles.backgroundColor ?? "#ffffff");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Font family</Label>
          <Input
            value={styles.fontFamily ?? ""}
            onChange={(event) => handleChange("fontFamily", event.target.value)}
            placeholder="Enter font stack"
            className="mt-1 h-11 rounded-xl bg-white py-0 text-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Font weight</Label>
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
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Text align</Label>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Font size" suffix="px" value={styles.fontSize} onChange={(value) => handleChange("fontSize", value)} />
        <NumberField label="Line height" suffix="px" value={styles.lineHeight} onChange={(value) => handleChange("lineHeight", value)} />
        <NumberField
          label="Letter spacing"
          suffix="px"
          value={styles.letterSpacing}
          onChange={(value) => handleChange("letterSpacing", value)}
        />
        <TextField
          label="Text transform"
          value={styles.textTransform ?? ""}
          onChange={(value) => handleChange("textTransform", value)}
          placeholder="none | uppercase"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ColorField label="Text color" value={colorValue} onChange={(value) => handleChange("color", value)} />
        <ColorField label="Background" value={backgroundValue} onChange={(value) => handleChange("backgroundColor", value)} />
      </div>

      <div className="space-y-4 rounded-2xl border border-dashed border-border/60 p-4">
        <SpacingField label="Padding" value={styles.padding} onChange={(value) => handleChange("padding", value)} />
        <SpacingField label="Margin" value={styles.margin} onChange={(value) => handleChange("margin", value)} />
      </div>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value?: string;
  suffix?: string;
  onChange: (value: string) => void;
}

function NumberField({ label, value, suffix = "px", onChange }: NumberFieldProps) {
  const numeric = value ? parseFloat(value) : NaN;
  const displayValue = Number.isFinite(numeric) ? numeric : "";
  return (
    <div>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1 flex h-11 items-center gap-2 rounded-xl border border-input bg-white px-3">
        <Input
          type="number"
          value={displayValue}
          onChange={(event) => {
            const next = event.target.value;
            onChange(next === "" ? "" : `${next}${suffix}`);
          }}
          unstyled
          className="h-full border-0 px-0 text-base"
        />
        <span className="text-xs uppercase text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

function TextField({ label, value, placeholder, onChange }: TextFieldProps) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1 flex h-11 items-center rounded-xl border border-input bg-white px-3">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          unstyled
          className="text-base"
        />
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
    <div>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1 flex h-11 items-center gap-3 rounded-xl border border-input bg-white px-3">
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-10 cursor-pointer rounded-lg border border-border bg-transparent"
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} unstyled className="h-full border-0 px-0 text-sm" />
      </div>
    </div>
  );
}
