# domograph

Live debug overlay charting DOM-node count over time. Framework-free —
drop into any page to spot leaks and runaway component trees while
developing.

## Install

```bash
bun add domograph
# or: npm i domograph / pnpm add domograph / yarn add domograph
```

## Usage

```ts
import { createDomograph } from "domograph";

const monitor = createDomograph();
monitor.show(); // mounts to document.body and starts sampling
```

### Options

```ts
createDomograph({
  position: "bottom-right", // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  width: 280,
  height: 110,
  history: 200,
  sampleIntervalMs: 200,
  margin: 6,
  zIndex: 2147483647,
  label: "DOM",
  count: () => document.querySelectorAll("*").length, // override
});
```

### API

```ts
const m = createDomograph();
m.show(parent?);  // mount + start sampling
m.hide();         // stop + detach (reusable)
m.sample();       // force a sample now, returns the count
m.showPiP();      // pop the chart into a floating window (Chromium only)
m.destroy();      // permanent
m.element;        // the floating root element
```

### Floating window

The chart includes a small icon in its top-right that opens a Document
Picture-in-Picture window so the chart stays on top of any tab or app.
You can also trigger it programmatically:

```ts
await m.showPiP(); // resolves with the PiP `Window`, or `null` if unsupported
```

Browser support: Chrome 116+, Edge, Opera. The icon is hidden automatically
on Firefox and Safari, where the API isn't available yet.

## License

MIT
