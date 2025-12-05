export type SpacingValues = {
  top: string;
  right: string;
  bottom: string;
  left: string;
};

export function parseSpacing(value?: string): SpacingValues {
  const fallback: SpacingValues = { top: "", right: "", bottom: "", left: "" };
  if (!value) return fallback;
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) {
    return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  }
  if (parts.length === 2) {
    return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  }
  if (parts.length === 3) {
    return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  }
  return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
}

export function formatSpacing({ top, right, bottom, left }: SpacingValues): string {
  const values = [top, right, bottom, left].map((entry) => entry?.trim() ?? "");
  if (values.every((entry) => entry === "")) {
    return "";
  }
  const normalized = values.map((entry) => (entry === "" ? "0px" : entry));
  return normalized.join(" ");
}
