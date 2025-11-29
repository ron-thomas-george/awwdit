import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PageInsightsPayload } from "@/lib/messages";

interface ImagesSectionProps {
  assets: PageInsightsPayload["images"];
}

export function ImagesSection({ assets }: ImagesSectionProps) {
  return (
    <div className="space-y-3">
      {assets.map((image) => (
        <Card key={image.src} className="overflow-hidden rounded-2xl border border-border/60 bg-white/90 shadow-none">
          <div className="h-40 w-full bg-muted">
            <img src={image.src} alt={image.alt || "Asset preview"} className="h-full w-full object-cover" loading="lazy" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold truncate">{image.alt || image.src.split("/").pop()}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {image.width} × {image.height}px · {image.type}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <p className="truncate">{image.src}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
