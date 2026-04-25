# @domograph/vue

Vue 3 plugin for [@domograph/core](https://github.com/thyngster/domograph/tree/main/packages/core) — a drop-in live overlay
charting DOM-node count over time. Useful for spotting leaks while
debugging Vue apps.

## Install

```bash
bun add @domograph/vue
# or: npm i @domograph/vue / pnpm add @domograph/vue / yarn add @domograph/vue
```

## Usage

```ts
import { createApp } from "vue";
import App from "./App.vue";
import DomographPlugin from "@domograph/vue";

createApp(App)
  .use(DomographPlugin) // auto-shows in dev (`import.meta.env.DEV`)
  .mount("#app");
```

### Options

```ts
app.use(DomographPlugin, {
  enabled: true, // boolean | () => boolean
  manual: false, // skip auto-mount; call show() yourself
  position: "bottom-right", // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  width: 280,
  height: 110,
  history: 200,
  sampleIntervalMs: 200,
  margin: 6,
  zIndex: 2147483647,
  label: "DOM",
});
```

### Composable

```ts
import { useDomograph } from "@domograph/vue";

const monitor = useDomograph(); // null if disabled or not installed
monitor?.hide();
monitor?.show();
```
