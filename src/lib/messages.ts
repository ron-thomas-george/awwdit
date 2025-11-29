export type PanelToContentMessage =
  | {
      type: "TOGGLE_INSPECT_MODE";
      payload: {
        enabled: boolean;
        showHoverCard: boolean;
      };
    }
  | {
      type: "UPDATE_HOVER_CARD";
      payload: {
        showHoverCard: boolean;
      };
    }
  | {
      type: "APPLY_STYLE_PATCH";
      payload: {
        styles: Partial<ElementStyles>;
      };
    }
  | {
      type: "RESET_INLINE_STYLES";
    }
  | {
      type: "REQUEST_PAGE_INSIGHTS";
    }
  | {
      type: "CLOSE_PANEL";
    }
  | {
      type: "TOGGLE_PANEL_VISIBILITY";
    };

export type ContentToPanelMessage =
  | {
      type: "ELEMENT_SELECTED";
      payload: SelectedElementPayload;
    }
  | {
      type: "PAGE_INSIGHTS";
      payload: PageInsightsPayload;
    };

type PanelLifecycleMessage = {
  type: "PANEL_READY";
};

export type RuntimeMessage = (PanelToContentMessage | ContentToPanelMessage | PanelLifecycleMessage) & {
  __forwarded?: boolean;
};

export interface ElementStyles {
  fontFamily: string;
  fontWeight: string;
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
  textTransform: string;
  color: string;
  backgroundColor: string;
  margin?: string;
  padding?: string;
}

export interface ElementMetrics {
  width: number;
  height: number;
  margin: string;
  padding: string;
}

export interface ComputedCategory {
  name: string;
  properties: Array<{ property: string; value: string }>;
}

export interface SelectedElementPayload {
  tag: string;
  selector: string;
  preciseSelector: string;
  ancestors: string[];
  summary: string;
  textContent: string;
  styles: ElementStyles;
  metrics: ElementMetrics;
  computed: ComputedCategory[];
}

export interface PageInsightsPayload {
  overview: {
    title: string;
    url: string;
    description?: string;
    primaryFont?: string;
    totalNodes: number;
    previewImage?: string;
  };
  colors: Array<{
    value: string;
    contrastOnWhite?: string;
    usage: number;
  }>;
  typography: {
    headings: string;
    body: string;
  };
  images: Array<{
    src: string;
    alt?: string;
    width: number;
    height: number;
    type: "bitmap" | "vector";
  }>;
}
