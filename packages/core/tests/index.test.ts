import { expect, test } from "vite-plus/test";
import { createDomograph } from "../src/index.ts";

test("createDomograph returns an instance with the public API", () => {
  // jsdom-style guard: skip if no document available in this test runtime.
  if (typeof document === "undefined") return;

  const monitor = createDomograph({ count: () => 42 });
  expect(monitor.element).toBeDefined();
  expect(typeof monitor.show).toBe("function");
  expect(typeof monitor.hide).toBe("function");
  expect(typeof monitor.sample).toBe("function");
  expect(typeof monitor.destroy).toBe("function");
  expect(monitor.sample()).toBe(42);
  monitor.destroy();
});
