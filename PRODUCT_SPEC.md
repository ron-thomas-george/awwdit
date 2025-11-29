# Design Inspector Chrome Extension — Product Specification

## 1. Product Overview
### 1.1 Purpose
Deliver a Chrome extension that lets designers and front-end practitioners inspect and modify live webpage elements via a design-tool-inspired side panel, providing a bridge between classic dev tooling and visual design workflows.

### 1.2 Problem Statement
Designers rely on developer-centric tools (e.g., Chrome DevTools) that expose implementation details but feel intimidating and noisy. Designer-focused extensions like CSS Peeper are easy to use yet lack real-time editing, while design tools such as Figma Dev Mode do not work on production websites. Teams need a lightweight, visually oriented inspector that works everywhere.

### 1.3 Core Value Proposition
1. Familiar, friendly UI patterned after Figma/Sketch inspectors.
2. Real-time, reversible CSS editing directly on any live webpage.
3. Deep asset, typography, and color insights that accelerate design reviews and QA workflows.

### 1.4 Target Users
| Persona | Needs |
| --- | --- |
| UI/UX Designers | Understand spacing, typography, and color choices quickly without DevTools overhead. |
| Front-end Developers | Prototype CSS tweaks, test options live, and export snippets for implementation. |
| Design Reviewers | Verify build quality vs. specs during critiques. |
| QA Specialists | Confirm styles, spacing, and accessibility details while logging issues. |

## 2. Scope & Strategy
### 2.1 Goals (v1)
- Ship a Chrome side-panel experience optimized for inspection + live editing.
- Support hover + locked selection with visual overlays and info cards.
- Provide categorized CSS editing with reset/export controls.
- Offer asset, typography, color, and spacing insights that designers expect.

### 2.2 Non-goals (v1)
- Multi-user collaboration or annotation features (planned Phase 2+).
- Persisting edits back to source repositories.
- Automated accessibility audits beyond color contrast checks.

### 2.3 Dependencies & Assumptions
- Chrome 114+ for `sidePanel` API. Provide popup fallback for earlier versions and Edge.
- Permissions: `activeTab`, `scripting`, `storage`, `sidePanel`.
- React-based UI bundle delivered via Vite/Webpack; lazy-loaded resources to minimize page impact.
- Keyboard shortcut defaults (Cmd/Ctrl+Shift+I) configurable in Chrome settings.

## 3. User Experience
### 3.1 Primary Flows
1. **Activation & Onboarding**
   - User clicks toolbar icon → overlay + onboarding tooltip describing hover/click behavior.
   - Optional keyboard shortcut and context-menu entry "Inspect with Design Inspector".
2. **Hover Inspection**
   - Moving cursor shows semi-transparent overlay, bounding box, and floating info card with tag, dimensions, margin/padding visualization, and coordinates.
3. **Element Locking & Editing**
   - Click locks selection; Alt/Option cycles to parent; Ctrl/Cmd enables multi-select for comparison.
   - Side panel updates with element identity, breadcrumbs, and categorized CSS editors.
4. **Export & Reset**
   - Users tweak properties inline, see instant changes, reset per property or entirely, copy/export CSS in multiple formats, then close/pin panel as needed.
5. **Deactivation**
   - ESC or close button hides overlay and panel, but per-tab enabled state persists until tab closes or user toggles off.

### 3.2 Side Panel Layout
- Default docked width 360px; draggable between 320–400px, with collapse chevron.
- Top header: element tag, ID/class badges, breadcrumb, pin/unpin, close.
- Sections organized as collapsible accordions (Layout, Spacing, Typography, etc.) with smooth 150ms transitions.
- Computed styles view shows final values, inheritance indicators, and rule source (stylesheet + selector).

## 4. Functional Requirements
### 4.1 Extension Activation
| Capability | Details |
| --- | --- |
| Toolbar Icon | Toggles overlay + panel; reflects active state per tab. |
| Keyboard Shortcut | Default Cmd/Ctrl+Shift+I (customizable). |
| Context Menu | Right-click → "Inspect with Design Inspector" to activate + auto-focus selected element. |
| State Persistence | Store per-tab activation and pinned state via background script + `storage.session`. |

### 4.2 Element Selection & Visualization
| Feature | Behavior |
| --- | --- |
| Hover Overlay | Semi-transparent highlight with margin/padding/border color coding (content purple, padding green, border orange, margin blue). |
| Info Card | Floating card near cursor showing tag, classes, dims (px), margin/padding diagram, document position. Debounced hover listeners avoid jank. |
| Selection | Click to lock; second click unlocks; Alt/Option selects parent; Ctrl/Cmd allows multi-select grid for dimension comparison. Persistent highlight on locked elements. |
| Bounding Box | 1px solid outline plus handles to visualize element boundaries. |

### 4.3 Side Panel Sections
1. **Element Information**
   - Tag type, ID, class chips, clipboard copy buttons.
   - Hierarchy breadcrumb (body › main › section › div).
2. **CSS Property Categories** (collapsible):
   - *Layout*: display, position, flexbox, grid controls.
   - *Spacing*: margin/padding editors with linked axis toggles.
   - *Typography*: font family picker, font size/line height/letter spacing, font weight dropdown, color picker with HEX/RGB/HSL.
   - *Background*: color, gradient, image preview, blend mode.
   - *Border*: width/style/color, radius sliders + numeric inputs.
   - *Effects*: box-shadow editor with presets, opacity, transform inputs.
   - *Dimensions*: width/height/min-max controls, lock aspect ratio toggle.
   - *Advanced*: z-index, overflow, cursor, pointer-events, custom property editor.
3. **Computed Values**
   - Displays cascaded result, indicates inherited styles, and references source stylesheet/selector.

### 4.4 Live Editing & Change Management
| Requirement | Description |
| --- | --- |
| Inline Editing | Click value → input (text/number/color/dropdown); supports unit toggles (px/rem/em/%/vh/vw). Arrow keys increment/decrement; Shift modifies by ×10. |
| Real-time Updates | Edits immediately apply via content script mutation; ephemeral until reset. Changed properties marked with accent dot. |
| Reset Controls | Per-property reset icon; "Reset All" button restores original computed values. |
| Copy/Export | Buttons for "Copy CSS", "Copy inline styles", "Copy JS object", and "Export .css" (creates downloadable blob). |

### 4.5 Additional Insight Features
| Area | Capabilities |
| --- | --- |
| Assets Inspection | List detected images/SVGs linked to selected element; preview, dimensions, file size, download, copy URL. |
| Typography Details | Show actual font face, fallback stack, font source (local vs. webfont URL), weight usage, contrast ratio vs. background. |
| Color Palette Extraction | Global palette drawer summarizing prominent colors with HEX/RGB/HSL, copy buttons, mini contrast checker. |
| Spacing Analysis | Ruler tool overlay toggled from panel; snap-to-grid indicators, alignment guides, spacing consistency warnings. |

## 5. UI & Interaction Requirements
- Visual language inspired by provided mocks (see uploaded screenshots) with neutral background (#F5F5F6), subtle shadows, Inter typeface.
- Overlay backdrop dims page content by 8% opacity when panel is open (configurable in settings) while keeping interactions on selected element responsive.
- Panel controls have 12px spacing grid, 8px radius cards, and focus rings meeting WCAG 2.1 AA.
- Tooltips on advanced controls, micro-animations ≤150ms easing.
- Keyboard navigation: Tab order flows header → accordions → export controls; ESC closes panel; Enter commits edits.
- Provide high-contrast theme toggle switching palette to darker neutrals.

## 6. Technical Architecture
1. **Background Service Worker**
   - Manages global activation state, keyboard shortcuts, context menu, and communication between side panel and content scripts.
2. **Content Script**
   - Injected per active tab; handles DOM traversal, overlay rendering via absolutely positioned canvas/HTML, mutation application, and messaging with panel.
3. **Side Panel (React)**
   - Hosted via Chrome side panel API; uses `chrome.runtime.connect` for bi-directional messaging. Maintains UI state, property edits, multi-select comparisons, and exports.
4. **Messaging**
   - Structured messages (`INSPECT_START`, `ELEMENT_HOVER`, `ELEMENT_LOCK`, `STYLE_UPDATE`, `RESET`, `EXPORT_REQUEST`). Use debounced batching for hover events.
5. **Storage**
   - `chrome.storage.sync` for preferences (theme, overlay color, default units), `storage.session` for tab-specific selections.
6. **Performance**
   - Lazy-load font/color analysis modules. Throttle hover overlay paints to 60fps budget, detach listeners when extension inactive.

## 7. Accessibility & Compliance
- Full keyboard support, including multi-select using modifiers.
- ARIA labels for all interactive controls; announce selection changes via polite live region.
- Color contrast: at least 4.5:1 for text, 3:1 for icons vs. background.
- Provide reduced motion option disabling animations.

## 8. Analytics & Success Metrics
| Metric | Definition | Target (post-launch) |
| --- | --- | --- |
| Daily Active Users | Unique users interacting with panel per day. | 1k within 3 months. |
| Session Duration | Average time extension remains active. | ≥6 minutes. |
| Elements Inspected | Avg. locked selections per session. | ≥8. |
| Properties Modified | Avg. distinct properties edited per session. | ≥5. |
| Feature Adoption | % of sessions using color palette or asset inspection. | ≥40%. |
| Satisfaction | Chrome Web Store rating & qualitative feedback. | ≥4.5 ⭐. |

## 9. Competitive Landscape
| Competitor | Strengths | Weaknesses | Differentiation |
| --- | --- | --- | --- |
| CSS Peeper | Elegant UI, strong color extraction. | No live editing, limited layout info. | Real-time editing, computed styles, reset/export tools. |
| Chrome DevTools | Comprehensive, built-in, powerful. | Developer-centric, steep learning curve. | Designer-friendly, curated controls, simplified terminology. |
| Figma Dev Mode | Integrated with design workflow. | Only works on Figma files. | Works on any live site, immediate inspection without design handoff. |

## 10. Roadmap
- **Phase 1 (this spec)**: Core inspection, editing, assets/typography/color insights, spacing analysis, export.
- **Phase 2**: Responsive viewport presets, screenshot + annotation, design token extraction, Figma/Sketch integrations, collaboration handoffs.
- **Phase 3**: AI suggestions, full accessibility audits, performance hints, optimization recommendations, change history.

## 11. Risks & Mitigations
| Risk | Impact | Mitigation |
| --- | --- | --- |
| DOM-heavy pages causing overlay lag | Poor UX | Use requestAnimationFrame batching + throttled observers; allow users to reduce overlay detail. |
| Permission friction during install | Lower adoption | Provide clear rationale in onboarding, minimize required scopes. |
| Browser API changes | Maintenance overhead | Abstract Chrome-specific APIs, monitor Edge/Chromium updates, maintain popup fallback. |

## 12. Success Criteria for v1 Launch
- Extension published with documentation + onboarding walkthrough.
- QA sign-off on Chrome + Edge (114+) with automated tests covering messaging + editing flows.
- Internal dogfooding session with design + frontend teams capturing qualitative feedback.
- Support funnel (email or Intercom) ready for user issues and feature requests.
