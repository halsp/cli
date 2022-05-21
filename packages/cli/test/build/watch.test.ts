import { runin } from "@sfajs/testing";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import * as fs from "fs";
import { parseInject } from "@sfajs/inject";
import { AssetsService } from "../../src/services/assets.service";
import { WatchCompilerService } from "../../src/services/watch-compiler.service";

function runTest(options: {
  callback?: boolean;
  preserveWatchOutput?: boolean;
}) {
  test(`build watch`, async () => {
    let worked = false;
    let onCallback = false;
    await runin(`test/build/watch`, async () => {
      await new CliStartup(undefined, {
        watch: true,
        watchAssets: true,
        preserveWatchOutput: options.preserveWatchOutput == true,
      })
        .use(async (ctx, next) => {
          if (options.callback) {
            ctx.res.setBody({
              onWatchSuccess: () => {
                onCallback = true;
              },
            });
          }
          try {
            await next();
          } finally {
            const assetsService = await parseInject(ctx, AssetsService);
            assetsService.stopWatch();

            const watchCompilerService = await parseInject(
              ctx,
              WatchCompilerService
            );
            watchCompilerService.stop();
            watchCompilerService.stop(); // test again
          }
        })
        .add(BuildMiddlware)
        .run();

      expect(fs.existsSync("./dist")).toBeTruthy();
      expect(fs.existsSync("./dist/build-test.js")).toBeTruthy();
      worked = true;
    });
    expect(worked).toBeTruthy();
    expect(onCallback).toBe(!!options.callback);
  });
}

runTest({
  callback: true,
});
runTest({
  callback: false,
});
runTest({
  preserveWatchOutput: true,
});
