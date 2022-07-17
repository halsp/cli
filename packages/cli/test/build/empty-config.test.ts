import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import { parseInject } from "@ipare/inject";
import { AssetsService } from "../../src/services/build.services/assets.service";
import { WatchCompilerService } from "../../src/services/build.services/watch-compiler.service";

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
        callCount++;
      })
      .add(BuildMiddlware)
      .run();
    callCount++;
  });
  expect(callCount).toBe(3);
});
