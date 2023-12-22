import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import { CopyBuildResultMiddleware } from "../../src/middlewares/copy-build-result.middleware";
import * as fs from "fs";
import { AssetsService } from "../../src/services/build.services/assets.service";
import { WatchCompilerService } from "../../src/services/build.services/watch-compiler.service";
import path from "path";

describe("copy package", () => {
  it("should copy package", async () => {
    const cacheDir = ".cache-copy-package";
    let callCount = 0;
    await runin(`test/build/script`, async () => {
      await new CliStartup("test", undefined, {
        copyPackage: true,
        mode: "production",
        cacheDir: path.resolve(cacheDir),
      })
        .add(BuildMiddlware)
        .run();

      fs.existsSync(`./${cacheDir}/package.json`).should.true;
      callCount++;
    });
    callCount.should.eq(1);
  });

  it("should copy package without devDependencies", async () => {
    const cacheDir = ".cache-copy-package-wdd";
    let callCount = 0;
    await runin(`test/build/script`, async () => {
      await new CliStartup("test", undefined, {
        copyPackage: true,
        removeDevDeps: true,
        mode: "production",
        cacheDir: path.resolve(cacheDir),
      })
        .add(BuildMiddlware)
        .run();

      fs.existsSync(`./${cacheDir}/package.json`).should.true;
      JSON.parse(
        fs.readFileSync(`./${cacheDir}/package.json`, "utf-8"),
      ).devDependencies.should.deep.eq({});
      callCount++;
    });
    callCount.should.eq(1);
  });

  it("should not copy package whe package.json is not exist", async () => {
    const cwd = "package.json-not-exist";
    const cacheDir = ".cache-copy-package-not-exist";
    if (!fs.existsSync(`test/build/${cwd}`)) {
      fs.mkdirSync(`test/build/${cwd}`);
    }

    let callCount = 0;
    await runin(`test/build/${cwd}`, async () => {
      await new CliStartup("test", undefined, {
        copyPackage: true,
        mode: "production",
        cacheDir: path.resolve(cacheDir),
      })
        .add(BuildMiddlware)
        .run();

      fs.existsSync(`./${cacheDir}/package.json`).should.false;
      callCount++;
    });
    callCount.should.eq(1);
  });
});

describe("copy build files", () => {
  it(`should copy build files when use CopyBuildResultMiddleware`, async () => {
    const cacheDir = ".cache-copy-build-files-with-cbrm";
    let callCount = 0;
    await runin(`test/build/copy`, async () => {
      await new CliStartup(undefined, undefined, {
        cacheDir: path.resolve(cacheDir),
      })
        .add(BuildMiddlware)
        .add(CopyBuildResultMiddleware)
        .run();

      fs.existsSync("./dist").should.true;
      fs.existsSync("./dist/build-test.js").should.true;
      callCount++;
    });
    callCount.should.eq(1);
  });
});

describe("assets", () => {
  function expectAssetsFiles(cacheDir: string) {
    fs.existsSync(`./${cacheDir}`).should.true;
    fs.existsSync(`./${cacheDir}/default/test.txt`).should.true;
    fs.readFileSync(`./${cacheDir}/default/test.txt`, "utf-8").should.eq(
      "test-build",
    );
    fs.existsSync(`./${cacheDir}/build-test.js`).should.true;

    fs.existsSync(`./${cacheDir}/root/test.txt`).should.true;
    fs.existsSync(`./${cacheDir}/include/test.txt`).should.true;
    fs.existsSync(`./${cacheDir}/test/outDir/test.txt`).should.true;

    fs.existsSync(`./${cacheDir}/exclude/test.txt`).should.false;
  }

  it(`should build and copy assets`, async () => {
    const cacheDir = ".cache-build-and-copy-assets";
    let worked = false;
    await runin(`test/build/assets`, async () => {
      await new CliStartup("test", undefined, {
        cacheDir: path.resolve(cacheDir),
      })
        .add(BuildMiddlware)
        .run();
      expectAssetsFiles(cacheDir);
      worked = true;
    });
    worked.should.true;
  });

  it(`should build and copy command assets`, async () => {
    const cacheDir = ".cache-build-and-copy-command-assets";
    let worked = false;
    await runin(`test/build/assets`, async () => {
      await new CliStartup("test", undefined, {
        assets: "default/**/*",
        cacheDir: path.resolve(cacheDir),
      })
        .add(BuildMiddlware)
        .run();

      fs.existsSync(`./${cacheDir}`).should.true;
      fs.existsSync(`./${cacheDir}/default`).should.true;
      fs.existsSync(`./${cacheDir}/default/test.txt`).should.true;
      fs.readFileSync(`./${cacheDir}/default/test.txt`, "utf-8").should.eq(
        "test-build",
      );
      fs.existsSync(`./${cacheDir}/build-test.js`).should.true;
      worked = true;
    });
    worked.should.true;
  });

  async function runWatchAssetsTest(type: string) {
    const cacheDir = ".cache-build-watch-assets-" + type;
    const cacheFileName = `test-cache-${type}.txt`;
    const cacheSourceFile = `./default/${cacheFileName}`;
    const cacheTargetFile = `./${cacheDir}/default/${cacheFileName}`;
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
        cacheDir: path.resolve(cacheDir),
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
            const assetsService = await ctx.getService(AssetsService);
            await assetsService.stopWatch();

            const watchCompilerService =
              await ctx.getService(WatchCompilerService);
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
              () => fs.readFileSync(cacheTargetFile, "utf-8") == text,
            );

            fs.existsSync(cacheTargetFile).should.true;
            fs.readFileSync(cacheTargetFile, "utf-8").should.eq(
              cacheFileContent + cacheFileEditContent,
            );
          }
        })
        // unlink
        .use(async (ctx, next) => {
          await next();

          if (type == "unlink") {
            fs.unlinkSync(cacheSourceFile);
            await testWaiting(() => fs.existsSync(cacheTargetFile));

            fs.existsSync(cacheTargetFile).should.false;
          }
        })
        // add
        .use(async (ctx, next) => {
          await next();

          await fs.promises.writeFile(cacheSourceFile, cacheFileContent);
          await testWaiting(() => !fs.existsSync(cacheTargetFile));

          fs.existsSync(cacheTargetFile).should.true;
          fs.readFileSync(cacheTargetFile, "utf-8").should.eq(cacheFileContent);
        })
        .add(BuildMiddlware)
        .run();

      expectAssetsFiles(cacheDir);
      callCount++;
    });
    callCount.should.eq(3);
  }

  ["add", "edit", "unlink"].forEach((e) => {
    it(`should watch assets event '${e}'`, async () => {
      await runWatchAssetsTest(e);
    });
  });
});
