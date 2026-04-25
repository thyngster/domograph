import { expect, test } from "vite-plus/test";
import { DomographPlugin, DomographKey, useDomograph } from "../src/index.ts";

test("plugin exports the install hook + injection key", () => {
  expect(typeof DomographPlugin.install).toBe("function");
  expect(typeof DomographKey).toBe("symbol");
  expect(typeof useDomograph).toBe("function");
});
