# @domograph/core

Live debug overlay charting DOM-node count over time. Framework-free —
drop into any page to spot leaks and runaway component trees while
developing.

## Install

```bash
bun add @domograph/core
# or: npm i @domograph/core / pnpm add @domograph/core / yarn add @domograph/core
```

## Usage

```ts
import { createDomograph } from "@domograph/core";

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
m.destroy();      // permanent
m.element;        // the floating root element
```

## License

MIT
