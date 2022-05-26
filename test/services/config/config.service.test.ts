import path from "path";
import { ConfigService } from "../../../src/services/config.service";
import { runTest } from "../runTest";

runTest(ConfigService, async (res, service) => {
  expect(service.mode).toBe("production");
  expect(service.configFilePath).toBe(
    path.resolve(process.cwd(), "sfa-cli.config.ts")
  );
  expect(Object.keys(service.value).includes("services")).toBeTruthy();
});

runTest(
  ConfigService,
  async (res, service) => {
    expect(service.mode).toBe("test");
    expect(service.configFilePath).toBe(
      path.resolve(process.cwd(), "custom.config.ts")
    );
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
