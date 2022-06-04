import { runin } from "@sfajs/testing";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import * as fs from "fs";
import { parseInject } from "@sfajs/inject";
import { AssetsService } from "../../src/services/assets.service";
import { WatchCompilerService } from "../../src/services/watch-compiler.service";

function expectFiles() {
  expect(fs.existsSync("./.sfa-cache")).toBeTruthy();
  expect(fs.existsSync("./.sfa-cache/default/test.txt")).toBeTruthy();
  expect(fs.readFileSync("./.sfa-cache/default/test.txt", "utf-8")).toBe(
    "test-build"
  );
  expect(fs.existsSync("./.sfa-cache/build-test.js")).toBeTruthy();

  expect(fs.existsSync("./.sfa-cache/root/test.txt")).toBeTruthy();
  expect(fs.existsSync("./.sfa-cache/include/test.txt")).toBeTruthy();
  expect(fs.existsSync("./.sfa-cache/test/outDir/test.txt")).toBeTruthy();

  expect(fs.existsSync("./.sfa-cache/exclude/test.txt")).toBeFalsy();
}

test(`build assets`, async () => {
  let worked = false;
  await runin(`test/build/assets`, async () => {
    await new CliStartup().add(BuildMiddlware).run();
    expectFiles();
    worked = true;
  });
  expect(worked).toBeTruthy();
});

test(`build command assets`, async () => {
  let worked = false;
  await runin(`test/build/assets`, async () => {
    await new CliStartup(undefined, {
      assets: "default/**/*",
    })
      .add(BuildMiddlware)
      .run();

    expect(fs.existsSync("./.sfa-cache")).toBeTruthy();
    expect(fs.existsSync("./.sfa-cache/default")).toBeTruthy();
    expect(fs.existsSync("./.sfa-cache/default/test.txt")).toBeTruthy();
    expect(fs.readFileSync("./.sfa-cache/default/test.txt", "utf-8")).toBe(
      "test-build"
    );
    expect(fs.existsSync("./.sfa-cache/build-test.js")).toBeTruthy();
    worked = true;
  });
  expect(worked).toBeTruthy();
});

function runWatchAssetsTest(type: "add" | "edit" | "unlink") {
  test(`watch assets ${type}`, async () => {
    const cacheFileName = `test-cache-${type}.txt`;
    const cacheSourceFile = `./default/${cacheFileName}`;
    const cacheTargetFile = `./.sfa-cache/default/${cacheFileName}`;
    const cacheFileContent = "watchAssets";
    const cacheFileEditContent = "Edit";
    let callCount = 0;

    const testWaiting = async (waiting: () => boolean) => {
      let times = 0;
      while (waiting()) {
        if (times > 25) {
          // 5s
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
      await new CliStartup(undefined, {
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
          ctx.res.setBody({
            onWatchSuccess: () => {
              callCount++;
            },
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
  }, 10000);
}

runWatchAssetsTest("add");
runWatchAssetsTest("edit");
runWatchAssetsTest("unlink");
