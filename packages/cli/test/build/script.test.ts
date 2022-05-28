import { runin } from "@sfajs/testing";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import * as fs from "fs";

test(`build script`, async () => {
  let callCount = 0;
  await runin(`test/build/script`, async () => {
    await new CliStartup()
      .use(async (ctx, next) => {
        await next();

        expect(ctx["prebuild1"]).toBeTruthy();
        expect(ctx["prebuild2"]).toBeTruthy();
        expect(ctx["prebuild3"]).toBeTruthy();
        expect(ctx["postbuild1"]).toBeTruthy();
        expect(ctx["postbuild1"]).toBeTruthy();
        callCount++;
      })
      .add(BuildMiddlware)
      .run();

    expect(fs.existsSync("./dist")).toBeTruthy();
    expect(fs.existsSync("./dist/build-test.js")).toBeTruthy();
    callCount++;
  });
  expect(callCount).toBe(2);
});

test(`build script failed`, async () => {
  let callCount = 0;
  await runin(`test/build/script`, async () => {
    await new CliStartup(undefined, {
      mode: "development",
    })
      .use(async (ctx, next) => {
        await next();

        expect(ctx["prebuild1"]).toBeTruthy();
        expect(ctx["prebuild2"]).toBeTruthy();
        expect(ctx["prebuild3"]).toBeUndefined();
        expect(ctx["postbuild1"]).toBeUndefined();
        expect(ctx["postbuild1"]).toBeUndefined();
        callCount++;
      })
      .add(BuildMiddlware)
      .run();

    expect(fs.existsSync("./dist")).toBeTruthy();
    expect(fs.existsSync("./dist/build-test.js")).toBeTruthy();
    callCount++;
  });
  expect(callCount).toBe(2);
});
