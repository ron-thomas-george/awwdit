import type { PageInsightsPayload, SelectedElementPayload } from "@/lib/messages";

export const mockPageInsights: PageInsightsPayload = {
  overview: {
    title: "Switch — shadcn/ui",
    url: "https://ui.shadcn.com/docs/components/switch",
    description: "A control that allows the user to toggle between checked and unchecked states.",
    primaryFont: "Inter",
    totalNodes: 1432,
    previewImage: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60"
  },
  colors: [
    { value: "#111111", usage: 22, contrastOnWhite: "AAA" },
    { value: "#7C3AED", usage: 15, contrastOnWhite: "AA" },
    { value: "#F4F4F5", usage: 12, contrastOnWhite: "Pass" },
    { value: "#FFFFFF", usage: 27, contrastOnWhite: "—" },
    { value: "#F97316", usage: 8, contrastOnWhite: "AA" }
  ],
  typography: {
    headings: "Inter",
    body: "Space Grotesk"
  },
  images: [
    {
      src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=60",
      alt: "Hero illustration",
      width: 640,
      height: 360,
      type: "bitmap"
    },
    {
      src: "https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=400&q=60",
      alt: "Mood board",
      width: 400,
      height: 300,
      type: "bitmap"
    },
    {
      src: "https://placehold.co/128x128/svg",
      alt: "Icon grid",
      width: 128,
      height: 128,
      type: "vector"
    }
  ]
};

export const mockSelectedElement: SelectedElementPayload = {
  tag: "H1",
  selector: "hero .title",
  preciseSelector: "body > main:nth-of-type(1) > section.hero:nth-of-type(1) > h1",
  ancestors: ["body", "main.hero", "section.hero"],
  summary: "Primary hero headline",
  textContent: "Design systems with guard rails",
  styles: {
    fontFamily: "Inter",
    fontWeight: "600",
    fontSize: "48px",
    lineHeight: "56px",
    letterSpacing: "-0.5px",
    textAlign: "left",
    textTransform: "none",
    color: "#111111",
    backgroundColor: "transparent"
  },
  metrics: {
    width: 720,
    height: 120,
    margin: "16px",
    padding: "0px"
  },
  computed: [
    {
      name: "Layout",
      properties: [
        { property: "display", value: "block" },
        { property: "position", value: "relative" }
      ]
    },
    {
      name: "Typography",
      properties: [
        { property: "font-size", value: "48px" },
        { property: "line-height", value: "56px" },
        { property: "letter-spacing", value: "-0.5px" }
      ]
    },
    {
      name: "Color",
      properties: [
        { property: "color", value: "#111111" },
        { property: "background-color", value: "transparent" }
      ]
    }
  ]
};
