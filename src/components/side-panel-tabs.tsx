import type { PageInsightsPayload, SelectedElementPayload } from "@/lib/messages";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { OverviewSection } from "@/sections/OverviewSection";
import { ColorsSection } from "@/sections/ColorsSection";
import { TypographySection } from "@/sections/TypographySection";
import { ImagesSection } from "@/sections/ImagesSection";
import { LayoutDashboard, Palette, Type, ImageIcon } from "lucide-react";
import { useMemo } from "react";

interface SidePanelTabsProps {
  pageInsights?: PageInsightsPayload | null;
  selectedElement?: SelectedElementPayload | null;
}

export function SidePanelTabs({ pageInsights, selectedElement }: SidePanelTabsProps) {
  const insights = useMemo(() => pageInsights ?? null, [pageInsights]);

  return (
    <Tabs defaultValue="overview" className="flex h-full flex-col">
      <TabsList className="grid grid-cols-4 gap-1 rounded-2xl bg-muted/80 p-1" aria-label="Insights sections">
        <Tab value="overview" icon={<LayoutDashboard className="h-4 w-4" />} label="Overview" />
        <Tab value="colors" icon={<Palette className="h-4 w-4" />} label="Color" />
        <Tab value="type" icon={<Type className="h-4 w-4" />} label="Type" />
        <Tab value="assets" icon={<ImageIcon className="h-4 w-4" />} label="Assets" />
      </TabsList>

      <TabsContent value="overview" className="mt-4 flex-1 overflow-hidden min-w-0">
        <ScrollArea className="h-full min-w-0">
          <div className="px-1">
            {insights ? (
              <OverviewSection overview={insights.overview} colors={insights.colors} typography={insights.typography} />
            ) : (
              <EmptyState message="Activate inspect mode to fetch page overview." />
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="colors" className="mt-4 flex-1 overflow-hidden min-w-0">
        <ScrollArea className="h-full min-w-0">
          <div className="pr-3">
            {insights ? (
              <ColorsSection palette={insights.colors} />
            ) : (
              <EmptyState message="No color palette yet." />
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="type" className="mt-4 flex-1 overflow-hidden min-w-0">
        <ScrollArea className="h-full min-w-0">
          <div className="pr-3">
            {insights ? (
              <TypographySection entries={insights.typography} />
            ) : (
              <EmptyState message="Typography appears after scanning." />
            )}
            {selectedElement ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-white/80 p-3 text-xs">
                <p className="font-medium text-muted-foreground">Selected element</p>
                <p className="mt-1 text-sm font-semibold">
                  {selectedElement.styles.fontFamily} · {selectedElement.styles.fontWeight}
                </p>
                <p className="text-muted-foreground">{selectedElement.textContent.slice(0, 90)}...</p>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="assets" className="mt-4 flex-1 overflow-hidden min-w-0">
        <ScrollArea className="h-full min-w-0">
          <div className="pr-3">
            {insights ? <ImagesSection assets={insights.images} /> : <EmptyState message="Assets show up once the page loads." />}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}

interface TabProps {
  value: string;
  icon: React.ReactNode;
  label: string;
}

function Tab({ value, icon, label }: TabProps) {
  return (
    <TabsTrigger value={value} className="flex items-center justify-center rounded-xl p-2" aria-label={label}>
      {icon}
      <span className="sr-only">{label}</span>
    </TabsTrigger>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
