import { runin } from "@sfajs/testing";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import { parseInject } from "@sfajs/inject";
import { ConfigService } from "../../src/services/config.service";
import { AssetsService } from "../../src/services/assets.service";
import { WatchCompilerService } from "../../src/services/watch-compiler.service";

test(`build hooks`, async () => {
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

test(`watch build hooks`, async () => {
  let callCount = 0;
  await runin(`test/build/hook`, async () => {
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
