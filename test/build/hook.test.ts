import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import { parseInject } from "@ipare/inject";
import { ConfigService } from "../../src/services/build.services/config.service";
import { AssetsService } from "../../src/services/build.services/assets.service";
import { WatchCompilerService } from "../../src/services/build.services/watch-compiler.service";
import * as fs from "fs";

describe("hooks", () => {
  it(`should build and invoke hooks`, async () => {
    let callCount = 0;
    await runin(`test/build/hook`, async () => {
      await new CliStartup()
        .use(async (ctx, next) => {
          await next();

          const configService = await parseInject(ctx, ConfigService);
          const dict = configService.value["dict"]();

          expect(!!dict["beforeHook"]).toBeTruthy();
          expect(!!dict["afterHook"]).toBeTruthy();
          expect(!!dict["afterDeclarationsHook"]).toBeTruthy();
          callCount++;
        })
        .add(BuildMiddlware)
        .run();
      callCount++;
    });
    expect(callCount).toBe(2);
  });

  it(`should build and invoke hooks with watch`, async () => {
    let callCount = 0;
    await runin(`test/build/hook`, async () => {
      await new CliStartup("test", undefined, { watch: true })
        .use(async (ctx, next) => {
          ctx.bag("onWatchSuccess", () => {
            callCount++;
          });

          try {
            await next();
          } finally {
            const assetsService = await parseInject(ctx, AssetsService);
            await assetsService.stopWatch();

            const watchCompilerService = await parseInject(
              ctx,
              WatchCompilerService
            );
            watchCompilerService.stop();
          }

          const configService = await parseInject(ctx, ConfigService);
          const dict = configService.value["dict"]();

          expect(!!dict["beforeHook"]).toBeTruthy();
          expect(!!dict["afterHook"]).toBeTruthy();
          expect(!!dict["afterDeclarationsHook"]).toBeTruthy();
          callCount++;
        })
        .add(BuildMiddlware)
        .run();
      callCount++;
    });
    expect(callCount).toBe(3);
  });
});

describe("build script", () => {
  it("should exec prebuild scripts", async () => {
    let callCount = 0;
    await runin(`test/build/script`, async () => {
      await new CliStartup("test", undefined, {
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
      callCount++;
    });
    expect(callCount).toBe(2);
  }, 10000);

  it(`should build script failed`, async () => {
    let callCount = 0;
    await runin(`test/build/script`, async () => {
      await new CliStartup("test", undefined, {
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

  it(`should exec plugin script error`, async () => {
    let callCount = 0;
    await runin(`test/build/plugin-script-error`, async () => {
      await new CliStartup("test", undefined, {
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
});
