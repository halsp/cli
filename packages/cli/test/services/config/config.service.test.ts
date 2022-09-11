import { ConfigService } from "../../../src/services/build.services/config.service";
import { runTest } from "../runTest";
import { runin } from "../../utils";
import { CliStartup } from "../../../src/cli-startup";
import { parseInject } from "@ipare/inject";
import * as fs from "fs";
import { defineConfig } from "../../../src";

runTest(ConfigService, async (res, service) => {
  await service.init();
  expect(service.mode).toBeUndefined();
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
  undefined,
  {
    configName: "custom.config.ts",
    mode: "test",
  }
);

test(`json config file`, async () => {
  let worked = false;
  await runin("test/services/config/types", async () => {
    await new CliStartup("test", undefined, {
      configName: `ipare-cli.config.json`,
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
    await new CliStartup("test", undefined, {
      jsonConfig: await fs.promises.readFile("ipare-cli.config.json", "utf-8"),
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
    const func = defineConfig(() => ({
      start: {
        startupFile: "t1",
      },
    }));
    await new CliStartup("test", undefined, {
      funcConfig: func.toString(),
    })
      .use(async (ctx) => {
        const service = await parseInject(ctx, ConfigService);
        expect(service.value.start?.startupFile).toBe("t1");
        worked = true;
      })
      .run();
  });
  expect(worked).toBeTruthy();
});

test(`js config file`, async () => {
  let worked = false;
  await runin("test/services/config/types", async () => {
    await new CliStartup("test", undefined, {
      mode: "js-test",
      configName: `ipare-cli.config.js`,
    })
      .use(async (ctx) => {
        const service = await parseInject(ctx, ConfigService);
        expect(service.value.start?.startupFile).toBe("t1");
        worked = true;
      })
      .run();
  });
  expect(worked).toBeTruthy();
});
