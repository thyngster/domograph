# domograph

A live debug overlay that charts DOM node count over time. Useful for spotting
leaks and runaway component trees while developing single-page apps.

Framework-free core, with first-class Vue 3 bindings.

<p align="center">
  <img src="./demo.gif" alt="Domograph live demo" width="640" />
</p>

## Packages

| Package                          | Description                                 |
| -------------------------------- | ------------------------------------------- |
| [`domograph`](packages/core)     | Framework-free overlay. Drop into any page. |
| [`@domograph/vue`](packages/vue) | Vue 3 plugin + `useDomograph()` composable. |

## Quick start

### Vanilla

```bash
bun add domograph
```

```ts
import { createDomograph } from "domograph";

const monitor = createDomograph({ position: "bottom-right" });
monitor.show(); // mounts to document.body and starts sampling
```

### Vue 3

```bash
bun add @domograph/vue
```

```ts
import { createApp } from "vue";
import App from "./App.vue";
import DomographPlugin from "@domograph/vue";

createApp(App)
  .use(DomographPlugin) // auto-mounts when import.meta.env.DEV is true
  .mount("#app");
```

See each package's README for the full options reference.

## Repository layout

```
apps/
  website/        Demo + docs site
packages/
  core/           domograph
  vue/            @domograph/vue
```

This is a [Vite+](https://voidzero.dev/vite-plus) monorepo managed with Bun.
See [AGENTS.md](AGENTS.md) for the toolchain details.

## Development

Install dependencies:

```bash
vp install
```

Run the demo site:

```bash
vp run dev
```

Run tests across all packages:

```bash
vp run -r test
```

Build all packages:

```bash
vp run -r build
```

Format, lint, and type-check everything:

```bash
vp check
```

The `ready` script runs the full pre-commit gauntlet (`check`, `test`, `build`):

```bash
vp run ready
```

## Releasing

Both packages are versioned together. To cut a release:

1. Bump the `version` field in [`packages/core/package.json`](packages/core/package.json) and [`packages/vue/package.json`](packages/vue/package.json) to the same value (e.g. `0.0.2`).
2. Commit:
   ```bash
   git commit -am "release: 0.0.2"
   git push
   ```
3. Tag and push the tag — this triggers [`.github/workflows/release.yml`](.github/workflows/release.yml):
   ```bash
   git tag v0.0.2
   git push origin v0.0.2
   ```

The workflow verifies the tag matches both package versions, builds, pins `domograph`'s workspace dep in `@domograph/vue` to the released version, and publishes both to npm via OIDC trusted publishing (with provenance). It also creates a GitHub release with auto-generated notes.

## License

MIT &copy; [David Vallejo](https://github.com/thyngster)
