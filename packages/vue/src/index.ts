import { createDomograph, type DomographInstance, type DomographOptions } from "domograph";
import { inject, type App, type InjectionKey, type Plugin } from "vue";

export type { DomographInstance, DomographOptions } from "domograph";

export interface DomographPluginOptions extends DomographOptions {
  /**
   * Whether the overlay should mount on app install. Default: `true` when
   * `import.meta.env.DEV` is truthy at build time, otherwise `false`.
   * Pass a function to defer the decision until install time.
   */
  enabled?: boolean | (() => boolean);
  /**
   * If `true`, the plugin only creates the instance but does not mount it.
   * Use `useDomograph().show()` from a component to mount on demand.
   */
  manual?: boolean;
}

export const DomographKey: InjectionKey<DomographInstance> = Symbol("domograph");

function defaultEnabled(): boolean {
  // Vite/Webpack/Rollup all expose import.meta.env.DEV at build time. If the
  // flag is missing at runtime (e.g. CDN UMD usage) default to true so the
  // overlay still renders — users can pass `enabled: false` to opt out.
  const env = (import.meta as { env?: { DEV?: boolean } }).env;
  return env?.DEV ?? true;
}

export const DomographPlugin: Plugin<[DomographPluginOptions?]> = {
  install(app: App, options: DomographPluginOptions = {}) {
    const enabled =
      typeof options.enabled === "function"
        ? options.enabled()
        : (options.enabled ?? defaultEnabled());
    if (!enabled) return;

    const monitor = createDomograph(options);
    app.provide(DomographKey, monitor);

    if (!options.manual) {
      // Defer until DOM is ready so document.body exists in any mount order.
      if (typeof document !== "undefined") {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => monitor.show(), { once: true });
        } else {
          monitor.show();
        }
      }
    }

    const origUnmount = app.unmount.bind(app);
    app.unmount = () => {
      monitor.destroy();
      origUnmount();
    };
  },
};

export default DomographPlugin;

/**
 * Composable returning the active Domograph instance provided by
 * `app.use(DomographPlugin)`. Returns `null` if the plugin was disabled
 * or not installed.
 */
export function useDomograph(): DomographInstance | null {
  return inject(DomographKey, null);
}
