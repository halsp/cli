import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import { CopyBuildResultMiddleware } from "../../src/middlewares/copy-build-result.middleware";
import * as fs from "fs";
import { parseInject } from "@ipare/inject";
import { AssetsService } from "../../src/services/build.services/assets.service";
import { WatchCompilerService } from "../../src/services/build.services/watch-compiler.service";

describe("copy package", () => {
  it("should copy package", async () => {
    let callCount = 0;
    await runin(`test/build/script`, async () => {
      await new CliStartup("test", undefined, {
        copyPackage: true,
        mode: "production",
      })
        .add(BuildMiddlware)
        .run();

      expect(fs.existsSync("./.ipare-cache/package.json")).toBeTruthy();
      callCount++;
    });
    expect(callCount).toBe(1);
  }, 10000);

  it("should copy package without devDependencies", async () => {
    let callCount = 0;
    await runin(`test/build/script`, async () => {
      await new CliStartup("test", undefined, {
        copyPackage: true,
        removeDevDeps: true,
        mode: "production",
      })
        .add(BuildMiddlware)
        .run();

      expect(fs.existsSync("./.ipare-cache/package.json")).toBeTruthy();
      expect(
        JSON.parse(fs.readFileSync("./.ipare-cache/package.json", "utf-8"))
          .devDependencies
      ).toEqual({});
      callCount++;
    });
    expect(callCount).toBe(1);
  }, 10000);
});

describe("copy build files", () => {
  it(`should copy build files when use CopyBuildResultMiddleware`, async () => {
    let callCount = 0;
    await runin(`test/build/copy`, async () => {
      await new CliStartup()
        .add(BuildMiddlware)
        .add(CopyBuildResultMiddleware)
        .run();

      expect(fs.existsSync("./dist")).toBeTruthy();
      expect(fs.existsSync("./dist/build-test.js")).toBeTruthy();
      callCount++;
    });
    expect(callCount).toBe(1);
  }, 10000);
});

describe("assets", () => {
  function expectFiles() {
    expect(fs.existsSync("./.ipare-cache")).toBeTruthy();
    expect(fs.existsSync("./.ipare-cache/default/test.txt")).toBeTruthy();
    expect(fs.readFileSync("./.ipare-cache/default/test.txt", "utf-8")).toBe(
      "test-build"
    );
    expect(fs.existsSync("./.ipare-cache/build-test.js")).toBeTruthy();

    expect(fs.existsSync("./.ipare-cache/root/test.txt")).toBeTruthy();
    expect(fs.existsSync("./.ipare-cache/include/test.txt")).toBeTruthy();
    expect(fs.existsSync("./.ipare-cache/test/outDir/test.txt")).toBeTruthy();

    expect(fs.existsSync("./.ipare-cache/exclude/test.txt")).toBeFalsy();
  }

  it(`should build and copy assets`, async () => {
    let worked = false;
    await runin(`test/build/assets`, async () => {
      await new CliStartup().add(BuildMiddlware).run();
      expectFiles();
      worked = true;
    });
    expect(worked).toBeTruthy();
  }, 10000);

  it(`should build and copy command assets`, async () => {
    let worked = false;
    await runin(`test/build/assets`, async () => {
      await new CliStartup("test", undefined, {
        assets: "default/**/*",
      })
        .add(BuildMiddlware)
        .run();

      expect(fs.existsSync("./.ipare-cache")).toBeTruthy();
      expect(fs.existsSync("./.ipare-cache/default")).toBeTruthy();
      expect(fs.existsSync("./.ipare-cache/default/test.txt")).toBeTruthy();
      expect(fs.readFileSync("./.ipare-cache/default/test.txt", "utf-8")).toBe(
        "test-build"
      );
      expect(fs.existsSync("./.ipare-cache/build-test.js")).toBeTruthy();
      worked = true;
    });
    expect(worked).toBeTruthy();
  }, 10000);

  async function runWatchAssetsTest(type: string) {
    const cacheFileName = `test-cache-${type}.txt`;
    const cacheSourceFile = `./default/${cacheFileName}`;
    const cacheTargetFile = `./.ipare-cache/default/${cacheFileName}`;
    const cacheFileContent = "watchAssets";
    const cacheFileEditContent = "Edit";
    let callCount = 0;

    const testWaiting = async (waiting: () => boolean) => {
      let times = 0;
      while (waiting()) {
        if (times > 50) {
          // 10s
          break;
        }
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, 200);
        });
        times++;
      }
    };

    await runin(`test/build/assets`, async () => {
      await new CliStartup("test", undefined, {
        watch: true,
        watchAssets: true,
      })
        .use(async (ctx, next) => {
          if (fs.existsSync(cacheSourceFile)) {
            fs.unlinkSync(cacheSourceFile);
          }
          await next();
          if (fs.existsSync(cacheSourceFile)) {
            fs.unlinkSync(cacheSourceFile);
          }
        })
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
          callCount++;
        })
        // edit
        .use(async (ctx, next) => {
          await next();

          if (type == "edit") {
            const text = fs.readFileSync(cacheTargetFile, "utf-8");
            fs.writeFileSync(cacheSourceFile, text + cacheFileEditContent);
            await testWaiting(
              () => fs.readFileSync(cacheTargetFile, "utf-8") == text
            );

            expect(fs.existsSync(cacheTargetFile)).toBeTruthy();
            expect(fs.readFileSync(cacheTargetFile, "utf-8")).toBe(
              cacheFileContent + cacheFileEditContent
            );
          }
        })
        // unlink
        .use(async (ctx, next) => {
          await next();

          if (type == "unlink") {
            fs.unlinkSync(cacheSourceFile);
            await testWaiting(() => fs.existsSync(cacheTargetFile));

            expect(fs.existsSync(cacheTargetFile)).toBeFalsy();
          }
        })
        // add
        .use(async (ctx, next) => {
          await next();

          await fs.promises.writeFile(cacheSourceFile, cacheFileContent);
          await testWaiting(() => !fs.existsSync(cacheTargetFile));

          expect(fs.existsSync(cacheTargetFile)).toBeTruthy();
          expect(fs.readFileSync(cacheTargetFile, "utf-8")).toBe(
            cacheFileContent
          );
        })
        .add(BuildMiddlware)
        .run();

      expectFiles();
      callCount++;
    });
    expect(callCount).toBe(3);
  }

  ["add", "edit", "unlink"].forEach((e) => {
    it(`should watch assets event '${e}'`, async () => {
      await runWatchAssetsTest(e);
    }, 14000);
  });
});
