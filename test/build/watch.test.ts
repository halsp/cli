import { createTsconfig, runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import * as fs from "fs";
import { AssetsService } from "../../src/services/build.services/assets.service";
import { WatchCompilerService } from "../../src/services/build.services/watch-compiler.service";
import path from "path";

describe("build with watch", () => {
  async function runTest(options: { callback?: boolean }) {
    let callCount = 0;
    await runin(`test/build/watch`, async () => {
      const cacheDir = ".cache-build-with-watch-" + String(options.callback);
      const configFileName = `tsconfig.${cacheDir}.json`;
      createTsconfig(undefined, undefined, configFileName);
      await new CliStartup("test", undefined, {
        watch: true,
        watchAssets: true,
        preserveWatchOutput: true,
        sourceMap: true,
        cacheDir: path.resolve(cacheDir),
        tsconfigPath: configFileName,
      })
        .use(async (ctx, next) => {
          if (options.callback) {
            ctx.set("onWatchSuccess", () => {
              callCount++;
            });
            ctx.set("onWatchStoped", () => {
              callCount++;
            });
          }
          try {
            await next();
          } finally {
            const assetsService = await ctx.getService(AssetsService);
            await assetsService.stopWatch();

            const watchCompilerService =
              await ctx.getService(WatchCompilerService);
            watchCompilerService.stop();
            watchCompilerService.stop(); // test again
          }
          callCount++;
        })
        .add(BuildMiddlware)
        .run();

      fs.existsSync(`./${cacheDir}`).should.true;
      fs.existsSync(`./${cacheDir}/build-test.js`).should.true;
      fs.existsSync(`./${cacheDir}/build-test.js.map`).should.true;
      callCount++;
    });
    callCount.should.eq(options.callback ? 5 : 2);
  }

  it("should build with callback options", async () => {
    await runTest({
      callback: true,
    });
  });

  it("should build without callback options", async () => {
    await runTest({
      callback: false,
    });
  });
});
