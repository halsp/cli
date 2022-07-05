import { ConfigService } from "../../src/services/config.service";
import { runTest } from "./runTest";

runTest(
  ConfigService,
  async (ctx, service) => {
    (service as any).pluginInterfaceService.get = () => {
      return [
        { startupFile: "123" },
        () => ({
          startupFile: "456",
        }),
      ];
    };

    const cfg = await (service as any).loadConfig();
    expect(cfg.startupFile).toBe("789");
  },
  undefined,
  {
    jsonConfig: `{"startupFile":"789"}`,
  }
);
