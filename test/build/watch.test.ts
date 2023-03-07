import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import * as fs from "fs";
import { parseInject } from "@halsp/inject";
import { AssetsService } from "../../src/services/build.services/assets.service";
import { WatchCompilerService } from "../../src/services/build.services/watch-compiler.service";
import path from "path";

describe("build with watch", () => {
  async function runTest(options: { callback?: boolean }) {
    let callCount = 0;
    await runin(`test/build/watch`, async () => {
      const cacheDir = ".cache-build-with-watch-" + String(options.callback);
      await new CliStartup("test", undefined, {
        watch: true,
        watchAssets: true,
        preserveWatchOutput: true,
        sourceMap: true,
        cacheDir: path.resolve(cacheDir),
      })
        .use(async (ctx, next) => {
          if (options.callback) {
            ctx.set("onWatchSuccess", () => {
              callCount++;
            });
          }
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
            watchCompilerService.stop(); // test again
          }
          callCount++;
        })
        .add(BuildMiddlware)
        .run();

      expect(fs.existsSync(`./${cacheDir}`)).toBeTruthy();
      expect(fs.existsSync(`./${cacheDir}/build-test.js`)).toBeTruthy();
      expect(fs.existsSync(`./${cacheDir}/build-test.js.map`)).toBeTruthy();
      callCount++;
    });
    expect(callCount).toBe(options.callback ? 3 : 2);
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
