import { ConfigService } from "../../../src/services/config.service";
import { runTest } from "../runTest";

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
