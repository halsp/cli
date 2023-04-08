import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import { parseInject } from "@halsp/inject";
import { ConfigService } from "../../src/services/build.services/config.service";
import { AssetsService } from "../../src/services/build.services/assets.service";
import { WatchCompilerService } from "../../src/services/build.services/watch-compiler.service";
import * as fs from "fs";
import path from "path";
import { expect } from "chai";

describe("hooks", () => {
  it(`should build and invoke hooks`, async () => {
    let callCount = 0;
    await runin(`test/build/hook`, async () => {
      await new CliStartup()
        .use(async (ctx, next) => {
          await next();

          const configService = await parseInject(ctx, ConfigService);
          const dict = configService.value["dict"]();

          (!!dict["beforeHook"]).should.true;
          (!!dict["afterHook"]).should.true;
          (!!dict["afterDeclarationsHook"]).should.true;
          callCount++;
        })
        .add(BuildMiddlware)
        .run();
      callCount++;
    });
    callCount.should.eq(2);
  });

  it(`should build and invoke hooks with watch`, async () => {
    let callCount = 0;
    await runin(`test/build/hook`, async () => {
      await new CliStartup("test", undefined, { watch: true })
        .use(async (ctx, next) => {
          ctx.set("onWatchSuccess", () => {
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

          (!!dict["beforeHook"]).should.true;
          (!!dict["afterHook"]).should.true;
          (!!dict["afterDeclarationsHook"]).should.true;
          callCount++;
        })
        .add(BuildMiddlware)
        .run();
      callCount++;
    });
    callCount.should.eq(3);
  });
});

describe("build script", () => {
  it("should exec prebuild scripts", async () => {
    const cacheDir = ".cache-build-script-prebuild";
    let callCount = 0;
    await runin(`test/build/script`, async () => {
      await new CliStartup("test", undefined, {
        mode: "production",
        cacheDir: path.resolve(cacheDir),
      })
        .use(async (ctx, next) => {
          await next();

          const configService = await parseInject(ctx, ConfigService);
          const cfg = configService.value;
          cfg["prebuild1"].should.true;
          cfg["prebuild2"].should.true;
          cfg["prebuild3"].should.true;
          cfg["postbuild1"].should.true;
          cfg["postbuild1"].should.true;
          callCount++;
        })
        .add(BuildMiddlware)
        .run();

      fs.existsSync(`./${cacheDir}`).should.true;
      fs.existsSync(`./${cacheDir}/build-test.js`).should.true;
      callCount++;
    });
    callCount.should.eq(2);
  });

  it(`should build script failed`, async () => {
    const cacheDir = ".cache-build-script-failed";
    let callCount = 0;
    await runin(`test/build/script`, async () => {
      await new CliStartup("test", undefined, {
        mode: "development",
        cacheDir: path.resolve(cacheDir),
      })
        .use(async (ctx, next) => {
          await next();

          const configService = await parseInject(ctx, ConfigService);
          const cfg = configService.value;
          cfg["prebuild1"].should.true;
          cfg["prebuild2"].should.true;
          expect(cfg["prebuild3"]).undefined;
          expect(cfg["postbuild1"]).undefined;
          expect(cfg["postbuild1"]).undefined;
          callCount++;
        })
        .add(BuildMiddlware)
        .run();

      fs.existsSync(`./${cacheDir}`).should.false;
      callCount++;
    });
    callCount.should.eq(2);
  });

  it(`should exec plugin script error`, async () => {
    const cacheDir = ".cache-build-plugin-script-failed";
    let callCount = 0;
    await runin(`test/build/plugin-script-error`, async () => {
      await new CliStartup("test", undefined, {
        mode: "production",
        cacheDir: path.resolve(cacheDir),
      })
        .use(async (ctx, next) => {
          await next();

          const configService = await parseInject(ctx, ConfigService);
          const cfg = configService.value;
          expect(cfg["prebuild"]).undefined;
          expect(cfg["postbuild"]).undefined;
          callCount++;
        })
        .add(BuildMiddlware)
        .run();

      fs.existsSync(`./${cacheDir}`).should.true;
      fs.existsSync(`./${cacheDir}/build-test.js`).should.true;
      callCount++;
    });
    callCount.should.eq(2);
  });
});
