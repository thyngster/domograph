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
  /** Override the node-count function (useful for testing). */
  count?: () => number;
}

export interface DomographInstance {
  /** Floating root element. */
  readonly element: HTMLDivElement;
  /** Mount the widget under `parent` (default: document.body) and start sampling. */
  show(parent?: HTMLElement): void;
  /** Stop sampling and detach the element from the DOM. Reusable via `show()`. */
  hide(): void;
  /** Force-take a sample now. */
  sample(): number;
  /** Permanently destroy the instance. */
  destroy(): void;
}

const DEFAULTS: Required<Omit<DomographOptions, "count">> = {
  history: 200,
  sampleIntervalMs: 200,
  width: 280,
  height: 110,
  position: "bottom-right",
  margin: 6,
  zIndex: 2147483647,
  label: "DOM",
};

function defaultCount(): number {
  let n = 0;
  const walker = document.createTreeWalker(document, NodeFilter.SHOW_ALL, null);
  while (walker.nextNode()) n++;
  return n;
}

function applyCorner(el: HTMLElement, corner: DomographCorner, margin: number): void {
  el.style.position = "fixed";
  el.style.top = "";
  el.style.bottom = "";
  el.style.left = "";
  el.style.right = "";
  if (corner.startsWith("top")) el.style.top = `${margin}px`;
  else el.style.bottom = `${margin}px`;
  if (corner.endsWith("left")) el.style.left = `${margin}px`;
  else el.style.right = `${margin}px`;
}

interface InternalState {
  samples: number[];
  prev: number;
  lastSampleAt: number;
  rafId: number | null;
  mounted: boolean;
  destroyed: boolean;
}

export function createDomograph(userOptions: DomographOptions = {}): DomographInstance {
  const opts = { ...DEFAULTS, ...userOptions };
  const count = userOptions.count ?? defaultCount;

  const container = document.createElement("div");
  container.dataset.domograph = "";
  container.style.cssText = [
    `width:${opts.width}px`,
    "opacity:0.95",
    "overflow:hidden",
    `z-index:${opts.zIndex}`,
    "background:linear-gradient(180deg,#0d1a30 0%,#0a1322 100%)",
    "border:1px solid #1f3358",
    "border-radius:6px",
    "box-shadow:0 4px 12px rgba(0,0,0,0.35)",
    "font-family:ui-monospace,SFMono-Regular,Menlo,monospace",
    "color:#cfe6ff",
    "pointer-events:none",
  ].join(";");
  applyCorner(container, opts.position, opts.margin);

  const header = document.createElement("div");
  header.style.cssText =
    "display:flex;justify-content:space-between;align-items:baseline;padding:5px 8px 1px;gap:6px";
  container.appendChild(header);

  const labelEl = document.createElement("span");
  labelEl.textContent = opts.label;
  labelEl.style.cssText =
    "color:#5d88b8;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase";
  header.appendChild(labelEl);

  const headerRight = document.createElement("span");
  headerRight.style.cssText = "display:flex;align-items:baseline;gap:4px";
  header.appendChild(headerRight);

  const valueEl = document.createElement("span");
  valueEl.textContent = "–";
  valueEl.style.cssText = "color:#e8f4ff;font-size:18px;font-weight:700;tab-size:1";
  headerRight.appendChild(valueEl);

  const deltaEl = document.createElement("span");
  deltaEl.style.cssText =
    "color:#5d88b8;font-size:11px;font-weight:600;min-width:46px;text-align:right";
  headerRight.appendChild(deltaEl);

  const meta = document.createElement("div");
  meta.style.cssText =
    "display:flex;justify-content:space-between;padding:0 10px 4px;font-size:10px;font-weight:600;color:#4a6c91;letter-spacing:0.06em";
  container.appendChild(meta);

  const minEl = document.createElement("span");
  const maxEl = document.createElement("span");
  minEl.textContent = "min –";
  maxEl.textContent = "max –";
  meta.appendChild(minEl);
  meta.appendChild(maxEl);

  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = opts.width * dpr;
  canvas.height = opts.height * dpr;
  canvas.style.cssText = `width:${opts.width}px;height:${opts.height}px;display:block`;
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const state: InternalState = {
    samples: [],
    prev: 0,
    lastSampleAt: 0,
    rafId: null,
    mounted: false,
    destroyed: false,
  };

  function fmtDelta(d: number): { text: string; color: string } {
    if (d === 0) return { text: "·", color: "#4a6c91" };
    const sign = d > 0 ? "+" : "−";
    return {
      text: sign + Math.abs(d).toLocaleString(),
      color: d > 0 ? "#ff8a8a" : "#7be3a4",
    };
  }

  function draw(): void {
    if (state.samples.length < 2) return;
    const w = opts.width;
    const h = opts.height;
    ctx.clearRect(0, 0, w, h);

    const max = Math.max(...state.samples);
    const min = Math.min(...state.samples);
    const range = Math.max(1, max - min);
    const stepX = w / Math.max(1, opts.history - 1);

    ctx.strokeStyle = "rgba(95,140,200,0.08)";
    ctx.lineWidth = 1;
    for (const frac of [0.25, 0.5, 0.75]) {
      const y = Math.round(h * frac) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const points: [number, number][] = state.samples.map((v, i) => {
      const x = i * stepX;
      const norm = (v - min) / range;
      const y = h - 3 - norm * (h - 6);
      return [x, y];
    });

    ctx.beginPath();
    ctx.moveTo(points[0][0], h);
    for (const [x, y] of points) ctx.lineTo(x, y);
    ctx.lineTo(points[points.length - 1][0], h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(108,204,255,0.42)");
    grad.addColorStop(1, "rgba(108,204,255,0)");
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i];
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#6cf";
    ctx.lineWidth = 1.25;
    ctx.lineJoin = "round";
    ctx.stroke();

    const peakIdx = state.samples.indexOf(max);
    if (peakIdx >= 0 && peakIdx < points.length) {
      const [px, py] = points[peakIdx];
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,200,120,0.85)";
      ctx.fill();
    }

    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last[0], last[1], 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#6cf";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function tick(): void {
    if (state.destroyed) return;
    const now = Date.now();
    if (now - state.lastSampleAt >= opts.sampleIntervalMs) {
      state.lastSampleAt = now;
      const v = count();
      state.samples.push(v);
      if (state.samples.length > opts.history) state.samples.shift();

      valueEl.textContent = v.toLocaleString();
      const d = fmtDelta(v - state.prev);
      state.prev = v;
      if (state.samples.length > 1) {
        deltaEl.textContent = d.text;
        deltaEl.style.color = d.color;
      }

      const max = Math.max(...state.samples);
      const min = Math.min(...state.samples);
      minEl.textContent = `min ${min.toLocaleString()}`;
      maxEl.textContent = `max ${max.toLocaleString()}`;
      draw();
    }
    state.rafId = requestAnimationFrame(tick);
  }

  function show(parent: HTMLElement = document.body): void {
    if (state.destroyed) return;
    if (!state.mounted) {
      parent.appendChild(container);
      state.mounted = true;
    }
    if (state.rafId == null) state.rafId = requestAnimationFrame(tick);
  }

  function hide(): void {
    if (state.rafId != null) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    if (state.mounted && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    state.mounted = false;
  }

  function sample(): number {
    const v = count();
    state.samples.push(v);
    if (state.samples.length > opts.history) state.samples.shift();
    valueEl.textContent = v.toLocaleString();
    state.prev = v;
    draw();
    return v;
  }

  function destroy(): void {
    hide();
    state.destroyed = true;
    state.samples.length = 0;
  }

  return { element: container, show, hide, sample, destroy };
}
