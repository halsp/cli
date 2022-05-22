import { runin } from "@sfajs/testing";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import { parseInject } from "@sfajs/inject";
import { AssetsService } from "../../src/services/assets.service";
import { WatchCompilerService } from "../../src/services/watch-compiler.service";

test(`empty config`, async () => {
  let callCount = 0;
  await runin(`test/build/empty-config`, async () => {
    await new CliStartup().add(BuildMiddlware).run();
    callCount++;
  });
  expect(callCount).toBe(1);
});

test(`empty config`, async () => {
  let callCount = 0;
  await runin(`test/build/empty-config`, async () => {
    await new CliStartup(undefined, { watch: true })
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
          assetsService.stopWatch();

          const watchCompilerService = await parseInject(
            ctx,
            WatchCompilerService
          );
          watchCompilerService.stop();
        }
        callCount++;
      })
      .add(BuildMiddlware)
      .run();
    callCount++;
  });
  expect(callCount).toBe(3);
});
