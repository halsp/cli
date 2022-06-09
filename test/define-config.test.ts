import { defineConfig } from "../src";

test(`define config`, async () => {
  const cfg = defineConfig({
    packageManager: "pnpm",
  });
  expect(
    cfg({
      mode: "test",
      command: "start",
    }).packageManager
  ).toBe("pnpm");
});

test(`define func config`, async () => {
  const cfg = defineConfig(({ mode }) => {
    return {
      packageManager: mode == "test" ? "pnpm" : "cnpm",
    };
  });

  expect(
    cfg({
      mode: "test",
      command: "start",
    }).packageManager
  ).toBe("pnpm");

  expect(
    cfg({
      mode: "development",
      command: "build",
    }).packageManager
  ).toBe("cnpm");
});
