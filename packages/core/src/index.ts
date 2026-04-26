import { STYLES } from "./styles.js";
import type { DomographCorner, DomographOptions, DomographInstance } from "./types.js";

export type { DomographCorner, DomographOptions, DomographInstance } from "./types.js";

type DocumentPictureInPicture = {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
};

const DEFAULTS: Required<Omit<DomographOptions, "count">> = {
  history: 200,
  sampleIntervalMs: 200,
  width: 280,
  height: 110,
  position: "bottom-right",
  margin: 6,
  zIndex: 2147483647,
  label: "DOM",
  closable: true,
};

const PIP_ICON =
  '<svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
  '<rect x="1" y="2.5" width="14" height="11" rx="1.5" stroke="currentColor" stroke-width="1.4"/>' +
  '<rect x="8" y="7.5" width="6" height="4" rx="0.5" fill="currentColor"/>' +
  "</svg>";

const CLOSE_ICON =
  '<svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
  '<path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
  "</svg>";

function defaultCount(): number {
  let n = 0;
  const walker = document.createTreeWalker(document, NodeFilter.SHOW_ALL, null);
  while (walker.nextNode()) n++;
  return n;
}

function applyCorner(el: HTMLElement, corner: DomographCorner, margin: number): void {
  el.style.top = corner.startsWith("top") ? `${margin}px` : "";
  el.style.bottom = corner.startsWith("top") ? "" : `${margin}px`;
  el.style.left = corner.endsWith("left") ? `${margin}px` : "";
  el.style.right = corner.endsWith("left") ? "" : `${margin}px`;
}

interface InternalState {
  samples: number[];
  prev: number;
  lastSampleAt: number;
  rafId: number | null;
  mounted: boolean;
  destroyed: boolean;
  pipWindow: Window | null;
  pipReturnParent: HTMLElement | null;
}

export function createDomograph(userOptions: DomographOptions = {}): DomographInstance {
  const opts = { ...DEFAULTS, ...userOptions };
  const count = userOptions.count ?? defaultCount;

  const host = document.createElement("div");
  host.dataset.domograph = "";
  host.style.setProperty("--dg-w", `${opts.width}px`);
  host.style.setProperty("--dg-z", String(opts.zIndex));
  host.style.setProperty("--dg-canvas-h", `${opts.height}px`);
  applyCorner(host, opts.position, opts.margin);

  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>${STYLES}</style>
    <div class="root">
      <div class="header">
        <span class="label"></span>
        <span class="right">
          <span class="value">–</span>
          <span class="delta"></span>
          <button class="btn pip-btn" type="button" title="Open in floating window" aria-label="Open in floating window">${PIP_ICON}</button>
          <button class="btn close-btn" type="button" title="Close and unmount" aria-label="Close and unmount">${CLOSE_ICON}</button>
        </span>
      </div>
      <div class="meta">
        <span class="min">min –</span>
        <span class="max">max –</span>
      </div>
      <canvas class="canvas"></canvas>
    </div>
  `;

  const header = shadow.querySelector<HTMLDivElement>(".header")!;
  const labelEl = shadow.querySelector<HTMLSpanElement>(".label")!;
  const valueEl = shadow.querySelector<HTMLSpanElement>(".value")!;
  const deltaEl = shadow.querySelector<HTMLSpanElement>(".delta")!;
  const minEl = shadow.querySelector<HTMLSpanElement>(".min")!;
  const maxEl = shadow.querySelector<HTMLSpanElement>(".max")!;
  const canvas = shadow.querySelector<HTMLCanvasElement>(".canvas")!;
  const pipBtn = shadow.querySelector<HTMLButtonElement>(".pip-btn")!;
  const closeBtn = shadow.querySelector<HTMLButtonElement>(".close-btn")!;

  labelEl.textContent = opts.label;
  if (typeof window === "undefined" || !("documentPictureInPicture" in window)) {
    pipBtn.hidden = true;
  }
  if (!opts.closable) closeBtn.hidden = true;

  const ctx = canvas.getContext("2d")!;

  function resizeBitmap(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || opts.width;
    const h = canvas.clientHeight || opts.height;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeBitmap();

  const resizeObs = new ResizeObserver(() => {
    resizeBitmap();
    draw();
  });
  resizeObs.observe(canvas);

  const state: InternalState = {
    samples: [],
    prev: 0,
    lastSampleAt: 0,
    rafId: null,
    mounted: false,
    destroyed: false,
    pipWindow: null,
    pipReturnParent: null,
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
    const w = canvas.clientWidth || opts.width;
    const h = canvas.clientHeight || opts.height;
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

    // Right-align: pin the newest sample to the right edge, older samples
    // extend leftward. Buffer "fills" leftward until history is reached.
    const offset = w - (state.samples.length - 1) * stepX;
    const points: [number, number][] = state.samples.map((v, i) => {
      const x = offset + i * stepX;
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
      parent.appendChild(host);
      state.mounted = true;
    }
    if (state.rafId == null) state.rafId = requestAnimationFrame(tick);
  }

  function hide(): void {
    if (state.pipWindow && !state.pipWindow.closed) {
      const pip = state.pipWindow;
      // Null out first so the pagehide handler bails — we're tearing down.
      state.pipWindow = null;
      state.pipReturnParent = null;
      pip.close();
    }
    if (state.rafId != null) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    if (host.parentNode) {
      host.parentNode.removeChild(host);
    }
    state.mounted = false;
  }

  async function showPiP(): Promise<Window | null> {
    if (state.destroyed) return null;
    if (typeof window === "undefined") return null;
    const docPiP = (window as Window & { documentPictureInPicture?: DocumentPictureInPicture })
      .documentPictureInPicture;
    if (!docPiP) return null;

    if (state.pipWindow && !state.pipWindow.closed) {
      state.pipWindow.focus();
      return state.pipWindow;
    }

    // Header (~26px) + meta row (~14px) + canvas + a hair of breathing room.
    const pipWindow = await docPiP.requestWindow({
      width: opts.width,
      height: opts.height + 44,
    });
    state.pipWindow = pipWindow;
    state.pipReturnParent = (host.parentNode as HTMLElement | null) ?? document.body;

    pipWindow.document.body.style.cssText = "margin:0;background:#0a1322";
    host.dataset.pip = "";
    pipWindow.document.body.appendChild(host);

    if (state.rafId == null) state.rafId = requestAnimationFrame(tick);
    state.mounted = true;

    pipWindow.addEventListener("pagehide", () => {
      if (state.pipWindow !== pipWindow) return; // teardown raced us
      delete host.dataset.pip;
      applyCorner(host, opts.position, opts.margin);
      (state.pipReturnParent ?? document.body).appendChild(host);
      state.pipWindow = null;
      state.pipReturnParent = null;
    });

    return pipWindow;
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
    resizeObs.disconnect();
    state.destroyed = true;
    state.samples.length = 0;
  }

  pipBtn.addEventListener("click", () => {
    void showPiP();
  });
  closeBtn.addEventListener("click", () => {
    destroy();
  });

  // Drag-to-reposition. Header is the handle; clicks that originate on a
  // button (PiP, close) short-circuit so they still toggle their action.
  let drag: {
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    pointerId: number;
  } | null = null;

  function onDragDown(e: PointerEvent): void {
    if (state.pipWindow) return;
    if ((e.target as Element).closest(".btn")) return;
    e.preventDefault();
    const rect = host.getBoundingClientRect();
    host.style.top = `${rect.top}px`;
    host.style.left = `${rect.left}px`;
    host.style.right = "";
    host.style.bottom = "";
    drag = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      pointerId: e.pointerId,
    };
    header.setPointerCapture(e.pointerId);
    host.dataset.dragging = "";
  }

  function onDragMove(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const w = host.offsetWidth;
    const h = host.offsetHeight;
    const newLeft = Math.max(0, Math.min(window.innerWidth - w, drag.startLeft + dx));
    const newTop = Math.max(0, Math.min(window.innerHeight - h, drag.startTop + dy));
    host.style.left = `${newLeft}px`;
    host.style.top = `${newTop}px`;
  }

  function onDragEnd(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    header.releasePointerCapture(e.pointerId);
    drag = null;
    delete host.dataset.dragging;
  }

  header.addEventListener("pointerdown", onDragDown);
  header.addEventListener("pointermove", onDragMove);
  header.addEventListener("pointerup", onDragEnd);
  header.addEventListener("pointercancel", onDragEnd);

  return { element: host, show, hide, sample, showPiP, destroy };
}
