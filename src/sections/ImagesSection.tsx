import type { PageInsightsPayload } from "@/lib/messages";
import { Download } from "lucide-react";

interface ImagesSectionProps {
  assets: PageInsightsPayload["images"];
}

export function ImagesSection({ assets }: ImagesSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {assets.map((image) => (
        <div key={image.src} className="group relative h-36 w-full overflow-hidden rounded-2xl border border-border/60">
          <img src={image.src} alt={image.alt || "Asset preview"} loading="lazy" className="h-full w-full object-cover" />
          <a
            href={image.src}
            download
            target="_blank"
            rel="noreferrer"
            className="absolute left-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow transition-opacity group-hover:opacity-100 opacity-0"
            aria-label="Download image"
          >
            <Download className="h-4 w-4" />
          </a>
        </div>
      ))}
    </div>
  );
}
