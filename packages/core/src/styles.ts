export const STYLES = `
:host {
  position: fixed;
  width: var(--dg-w);
  z-index: var(--dg-z);
  pointer-events: none;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #cfe6ff;
}
:host([data-pip]) {
  position: static;
  width: 100%;
  height: 100vh;
}

.root {
  background: linear-gradient(180deg, #0d1a30 0%, #0a1322 100%);
  border: 1px solid #1f3358;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  opacity: 0.95;
  overflow: hidden;
}
:host([data-pip]) .root {
  border: none;
  border-radius: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 5px 8px 1px;
  gap: 6px;
  cursor: grab;
  pointer-events: auto;
  user-select: none;
  touch-action: none;
}
:host([data-dragging]) .header { cursor: grabbing; }
:host([data-pip]) .header {
  padding: min(1.6vh, 14px) min(2vw, 18px) min(0.4vh, 4px);
  cursor: default;
}

.label {
  color: #5d88b8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
:host([data-pip]) .label { font-size: clamp(11px, 1.6vw, 26px); }

.right {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.value {
  color: #e8f4ff;
  font-size: 18px;
  font-weight: 700;
  tab-size: 1;
}
:host([data-pip]) .value { font-size: clamp(18px, 4vw, 72px); }

.delta {
  color: #5d88b8;
  font-size: 11px;
  font-weight: 600;
  min-width: 46px;
  text-align: right;
}
:host([data-pip]) .delta { font-size: clamp(11px, 1.6vw, 26px); }

.btn {
  background: transparent;
  border: none;
  color: #5d88b8;
  cursor: pointer;
  padding: 0 0 0 4px;
  display: inline-flex;
  align-items: center;
  pointer-events: auto;
  line-height: 0;
  transition: color 120ms ease;
}
.btn:hover { color: #cfe6ff; }
.btn:focus-visible {
  color: #cfe6ff;
  outline: 1px solid #6cf;
  outline-offset: 2px;
  border-radius: 2px;
}
.btn[hidden] { display: none; }

.meta {
  display: flex;
  justify-content: space-between;
  padding: 0 10px 4px;
  font-size: 10px;
  font-weight: 600;
  color: #4a6c91;
  letter-spacing: 0.06em;
}
:host([data-pip]) .meta {
  padding: 0 min(2vw, 18px) min(0.8vh, 6px);
  font-size: clamp(10px, 1.4vw, 22px);
}

.canvas {
  display: block;
  width: 100%;
  height: var(--dg-canvas-h);
}
:host([data-pip]) .canvas {
  flex: 1;
  height: auto;
  min-height: 0;
}
`;
