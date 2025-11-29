import { ArrowLeft, Layers } from "lucide-react";
import type { SelectedElementPayload } from "@/lib/messages";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ElementControls } from "./element-controls";

interface SelectedElementViewProps {
  selectedElement: SelectedElementPayload;
  onBack: () => void;
  onChange: (styles: Partial<SelectedElementPayload["styles"]>) => void;
}

export function SelectedElementView({ selectedElement, onBack, onChange }: SelectedElementViewProps) {
  return (
    <section className="space-y-4">
      <Button variant="ghost" size="sm" className="w-fit px-2 text-sm" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to overview
      </Button>

      <Card className="border border-border/70">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-4 w-4 text-primary" />
            {selectedElement.tag.toUpperCase()}
          </CardTitle>
          <CardDescription className="text-muted-foreground">{selectedElement.preciseSelector}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {selectedElement.summary || "This element has no text content."}
        </CardContent>
      </Card>

      <ElementControls selectedElement={selectedElement} onChange={onChange} />
    </section>
  );
}
