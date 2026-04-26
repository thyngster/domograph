export type DomographCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface DomographOptions {
  /** Number of historical samples retained for the chart. Default 200. */
  history?: number;
  /** Sampling interval in ms. Default 200. */
  sampleIntervalMs?: number;
  /** Widget width in CSS pixels. Default 280. */
  width?: number;
  /** Chart canvas height in CSS pixels. Default 110. */
  height?: number;
  /** Corner to anchor the floating widget. Default 'bottom-right'. */
  position?: DomographCorner;
  /** Distance from the chosen corner. Default 6. */
  margin?: number;
  /** z-index for the overlay. Default 2147483647. */
  zIndex?: number;
  /** Optional label override. Default 'DOM'. */
  label?: string;
  /**
   * Show an X button in the chart's top-right that calls `destroy()`.
   * Set to `false` for embeds that should always remain visible.
   * Default `true`.
   */
  closable?: boolean;
  /** Override the node-count function (useful for testing). */
  count?: () => number;
}

export interface DomographInstance {
  /** Floating root element (the shadow DOM host). */
  readonly element: HTMLDivElement;
  /** Mount the widget under `parent` (default: document.body) and start sampling. */
  show(parent?: HTMLElement): void;
  /** Stop sampling and detach the element from the DOM. Reusable via `show()`. */
  hide(): void;
  /** Force-take a sample now. */
  sample(): number;
  /**
   * Move the chart into a Document Picture-in-Picture window so it floats on
   * top of any tab/app. Returns the PiP `Window` on success, `null` if the
   * browser doesn't support the API (Firefox/Safari).
   */
  showPiP(): Promise<Window | null>;
  /** Permanently destroy the instance. */
  destroy(): void;
}
