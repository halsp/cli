import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import * as fs from "fs";
import { parseInject } from "@ipare/inject";
import { ConfigService } from "../../src/services/build.services/config.service";

test(`build script`, async () => {
  let callCount = 0;
  await runin(`test/build/script`, async () => {
    await new CliStartup(undefined, {
      copyPackage: true,
      mode: "production",
    })
      .use(async (ctx, next) => {
        await next();

        const configService = await parseInject(ctx, ConfigService);
        const cfg = configService.value;
        expect(cfg["prebuild1"]).toBeTruthy();
        expect(cfg["prebuild2"]).toBeTruthy();
        expect(cfg["prebuild3"]).toBeTruthy();
        expect(cfg["postbuild1"]).toBeTruthy();
        expect(cfg["postbuild1"]).toBeTruthy();
        callCount++;
      })
      .add(BuildMiddlware)
      .run();

    expect(fs.existsSync("./.ipare-cache")).toBeTruthy();
    expect(fs.existsSync("./.ipare-cache/build-test.js")).toBeTruthy();
    expect(fs.existsSync("./.ipare-cache/package.json")).toBeTruthy();
    callCount++;
  });
  expect(callCount).toBe(2);
}, 10000);

test(`build script failed`, async () => {
  let callCount = 0;
  await runin(`test/build/script`, async () => {
    await new CliStartup(undefined, {
      mode: "development",
    })
      .use(async (ctx, next) => {
        await next();

        const configService = await parseInject(ctx, ConfigService);
        const cfg = configService.value;
        expect(cfg["prebuild1"]).toBeTruthy();
        expect(cfg["prebuild2"]).toBeTruthy();
        expect(cfg["prebuild3"]).toBeUndefined();
        expect(cfg["postbuild1"]).toBeUndefined();
        expect(cfg["postbuild1"]).toBeUndefined();
        callCount++;
      })
      .add(BuildMiddlware)
      .run();

    expect(fs.existsSync("./.ipare-cache")).toBeFalsy();
    callCount++;
  });
  expect(callCount).toBe(2);
}, 10000);

test(`plugin script error`, async () => {
  let callCount = 0;
  await runin(`test/build/plugin-script-error`, async () => {
    await new CliStartup(undefined, {
      mode: "production",
    })
      .use(async (ctx, next) => {
        await next();

        const configService = await parseInject(ctx, ConfigService);
        const cfg = configService.value;
        expect(cfg["prebuild"]).toBeUndefined();
        expect(cfg["postbuild"]).toBeUndefined();
        callCount++;
      })
      .add(BuildMiddlware)
      .run();

    expect(fs.existsSync("./.ipare-cache")).toBeTruthy();
    expect(fs.existsSync("./.ipare-cache/build-test.js")).toBeTruthy();
    callCount++;
  });
  expect(callCount).toBe(2);
}, 10000);
