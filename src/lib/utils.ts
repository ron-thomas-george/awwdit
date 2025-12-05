import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function oklabToRgb({ L, a, b }: { L: number; a: number; b: number }) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const toSrgb = (value: number) => (value > 0.0031308 ? 1.055 * value ** (1 / 2.4) - 0.055 : 12.92 * value);

  return {
    r: toSrgb(r) * 255,
    g: toSrgb(g) * 255,
    b: toSrgb(blue) * 255
  };
}

function oklchToRgb({ L, C, h }: { L: number; C: number; h: number }) {
  const hueRadians = (h * Math.PI) / 180;
  const a = C * Math.cos(hueRadians);
  const b = C * Math.sin(hueRadians);
  return oklabToRgb({ L, a, b });
}

function parseColorFunctionArguments(content: string, options?: { percentScale?: number[] }): { channels: number[]; alpha?: number } {
  const [valuePart, alphaPart] = content.split("/").map((part) => part.trim());
  const normalizedValuePart = valuePart.replace(/,/g, " ");
  const rawTokens = normalizedValuePart.split(/\s+/).filter(Boolean);
  const channels = rawTokens
    .map((token, index) => parseComponent(token, options?.percentScale?.[index] ?? 1))
    .filter((value): value is number => Number.isFinite(value));

  const alpha = alphaPart ? parseComponent(alphaPart, 1, true) : undefined;

  return {
    channels,
    alpha
  };
}

function parseComponent(token: string, percentScale = 1, clampToUnit = false) {
  if (!token) return NaN;
  const trimmed = token.trim();
  if (!trimmed) return NaN;
  const isPercent = trimmed.endsWith("%");
  const numeric = parseFloat(trimmed);
  if (Number.isNaN(numeric)) return NaN;
  const value = isPercent ? (numeric / 100) * percentScale : numeric;
  if (clampToUnit) {
    return Math.max(0, Math.min(1, value));
  }
  return value;
}

export function rgbToHex(color: string) {
  const rgbaRegex = /rgba?\(([^)]+)\)/i;
  const labRegex = /lab\(([^)]+)\)/i;
  const oklabRegex = /oklab\(([^)]+)\)/i;
  const oklchRegex = /oklch\(([^)]+)\)/i;

  const rgbaMatch = color.match(rgbaRegex);
  if (rgbaMatch) {
    const { channels, alpha } = parseColorFunctionArguments(rgbaMatch[1], { percentScale: [255, 255, 255] });
    if (channels.length >= 3) {
      return rgbComponentsToHex(channels[0], channels[1], channels[2], alpha);
    }
  }

  const labMatch = color.match(labRegex);
  if (labMatch) {
    const { channels } = parseColorFunctionArguments(labMatch[1]);
    if (channels.length >= 3) {
      const [l, a, b] = channels;
      const { r, g, b: blue } = labToRgb({ l, a, b });
      return rgbComponentsToHex(r, g, blue);
    }
  }

  const oklabMatch = color.match(oklabRegex);
  if (oklabMatch) {
    const { channels, alpha } = parseColorFunctionArguments(oklabMatch[1], { percentScale: [1, 1, 1] });
    if (channels.length >= 3) {
      const [L, a, b] = channels;
      const { r, g, b: blue } = oklabToRgb({ L, a, b });
      return rgbComponentsToHex(r, g, blue, alpha);
    }
  }

  const oklchMatch = color.match(oklchRegex);
  if (oklchMatch) {
    const { channels, alpha } = parseColorFunctionArguments(oklchMatch[1], { percentScale: [1, 1, 1] });
    if (channels.length >= 3) {
      const [L, C, h] = channels;
      const { r, g, b } = oklchToRgb({ L, C, h });
      return rgbComponentsToHex(r, g, b, alpha);
    }
  }

  return color;
}

function rgbComponentsToHex(r: number, g: number, b: number, alpha?: number) {
  const clamped = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  const hex = `#${clamped(r).toString(16).padStart(2, "0")}${clamped(g).toString(16).padStart(2, "0")}${clamped(b)
    .toString(16)
    .padStart(2, "0")}`.toUpperCase();
  if (typeof alpha === "number" && alpha >= 0 && alpha <= 1 && alpha !== 1) {
    const alphaHex = clamped(alpha * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
    return `${hex}${alphaHex}`;
  }
  return hex;
}

function labToRgb({ l, a, b }: { l: number; a: number; b: number }) {
  const y = (l + 16) / 116;
  const x = a / 500 + y;
  const z = y - b / 200;

  const xyz = [x, y, z].map((value, index) => {
    const reference = [0.95047, 1, 1.08883][index];
    const cubed = value ** 3;
    return (cubed > 0.008856 ? cubed : (value - 16 / 116) / 7.787) * reference;
  });

  const [X, Y, Z] = xyz;
  const rLinear = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
  const gLinear = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
  const bLinear = X * 0.0557 + Y * -0.204 + Z * 1.057;

  const compand = (value: number) =>
    value > 0.0031308 ? 1.055 * value ** (1 / 2.4) - 0.055 : 12.92 * value;

  return {
    r: compand(rLinear) * 255,
    g: compand(gLinear) * 255,
    b: compand(bLinear) * 255
  };
}
