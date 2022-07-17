import { Configuration } from "../../src";
import { ConfigService } from "../../src/services/config.service";
import { runTest } from "./runTest";

runTest(
  ConfigService,
  async (ctx, service) => {
    (service as any).pluginInterfaceService.get = (name) => {
      if (name == "cliConfig") {
        return [
          { startupFile: "123" },
          () => ({
            startupFile: "456",
          }),
        ];
      } else {
        return [];
      }
    };

    const cfg = await (service as any).loadConfig();
    expect(cfg.startupFile).toBe("789");
  },
  undefined,
  {
    jsonConfig: `{"startupFile":"789"}`,
  }
);

runTest(
  ConfigService,
  async (ctx, service) => {
    (service as any).pluginInterfaceService.get = (name) => {
      if (name == "cliConfigHook") {
        return [
          (config: Configuration) => {
            config.startupFile = "t1";
          },
        ];
      } else {
        return [];
      }
    };

    const cfg = await (service as any).loadConfig();
    expect(cfg.startupFile).toBe("t1");
  },
  undefined,
  {
    jsonConfig: `{"startupFile":"t1"}`,
  }
);

runTest(
  ConfigService,
  async (ctx, service) => {
    (service as any).pluginInterfaceService.get = (name) => {
      if (name == "cliConfigHook") {
        return [
          () => ({
            startupFile: "t1",
          }),
        ];
      } else {
        return [];
      }
    };

    const cfg = await (service as any).loadConfig();
    expect(cfg.startupFile).toBe("t1");
  },
  undefined,
  {
    jsonConfig: `{"startupFile":"t2"}`,
  }
);
