import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import * as fs from "fs";
import { parseInject } from "@sfajs/inject";
import { ConfigService } from "../../src/services/config.service";

test(`build script`, async () => {
  let callCount = 0;
  await runin(`test/build/script`, async () => {
    await new CliStartup()
      .use(async (ctx, next) => {
        await next();

        const configService = await parseInject(ctx, ConfigService);
        const cfg = configService.value;
        expect(cfg["prebuild1"]).toBeTruthy();
        expect(cfg["prebuild2"]).toBeTruthy();
        expect(cfg["prebuild3"]).toBeTruthy();
        expect(cfg["postbuild1"]).toBeTruthy();
        expect(cfg["postbuild1"]).toBeTruthy();
        callCount++;
      })
      .add(BuildMiddlware)
      .run();

    expect(fs.existsSync("./.sfa-cache")).toBeTruthy();
    expect(fs.existsSync("./.sfa-cache/build-test.js")).toBeTruthy();
    callCount++;
  });
  expect(callCount).toBe(2);
});

test(`build script failed`, async () => {
  let callCount = 0;
  await runin(`test/build/script`, async () => {
    await new CliStartup(undefined, {
      mode: "development",
    })
      .use(async (ctx, next) => {
        await next();

        const configService = await parseInject(ctx, ConfigService);
        const cfg = configService.value;
        expect(cfg["prebuild1"]).toBeTruthy();
        expect(cfg["prebuild2"]).toBeTruthy();
        expect(cfg["prebuild3"]).toBeUndefined();
        expect(cfg["postbuild1"]).toBeUndefined();
        expect(cfg["postbuild1"]).toBeUndefined();
        callCount++;
      })
      .add(BuildMiddlware)
      .run();

    expect(fs.existsSync("./.sfa-cache")).toBeFalsy();
    callCount++;
  });
  expect(callCount).toBe(2);
});
