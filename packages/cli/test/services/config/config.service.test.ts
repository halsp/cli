import { ConfigService } from "../../../src/services/config.service";
import { runTest } from "../runTest";
import { runin } from "@sfajs/testing";
import { CliStartup } from "../../../src/cli-startup";
import { parseInject } from "@sfajs/inject";
import * as fs from "fs";
import { defineConfig } from "@sfajs/cli-common";

runTest(ConfigService, async (res, service) => {
  await service.init();
  expect(service.mode).toBe("production");
  expect(Object.keys(service.value).includes("services")).toBeTruthy();
});

runTest(
  ConfigService,
  async (res, service) => {
    await service.init();
    expect(service.mode).toBe("test");
    expect(service.value).toEqual({
      custom: 1,
    });
    return;
  },
  undefined,
  {
    configName: "custom.config.ts",
    mode: "test",
  }
);

test(`json config file`, async () => {
  let worked = false;
  await runin("test/services/config/types", async () => {
    await new CliStartup(undefined, {
      configName: `sfa-cli.config.json`,
    })
      .use(async (ctx) => {
        const service = await parseInject(ctx, ConfigService);
        expect(service.value["type"]).toBe("json");
        worked = true;
      })
      .run();
  });
  expect(worked).toBeTruthy();
});

test(`json config command`, async () => {
  let worked = false;
  await runin("test/services/config/types", async () => {
    await new CliStartup(undefined, {
      jsonConfig: await fs.promises.readFile("sfa-cli.config.json", "utf-8"),
    })
      .use(async (ctx) => {
        const service = await parseInject(ctx, ConfigService);
        expect(service.value["type"]).toBe("json");
        worked = true;
      })
      .run();
  });
  expect(worked).toBeTruthy();
});

test(`json func command`, async () => {
  let worked = false;
  await runin("test/services/config/types", async () => {
    const func = defineConfig((c) => ({
      packageManager: "cnpm",
    }));
    await new CliStartup(undefined, {
      funcConfig: func.toString(),
    })
      .use(async (ctx) => {
        const service = await parseInject(ctx, ConfigService);
        expect(service.value.packageManager).toBe("cnpm");
        worked = true;
      })
      .run();
  });
  expect(worked).toBeTruthy();
});

test(`js config file`, async () => {
  let worked = false;
  await runin("test/services/config/types", async () => {
    await new CliStartup(undefined, {
      mode: "js-test",
      configName: `sfa-cli.config.js`,
    })
      .use(async (ctx) => {
        const service = await parseInject(ctx, ConfigService);
        expect(service.value.packageManager).toBe("cnpm");
        worked = true;
      })
      .run();
  });
  expect(worked).toBeTruthy();
});
