import { CommandService } from "../../src/services/command.service";
import { runTest } from "./runTest";

runTest(CommandService, async (res, service) => {
  expect(
    service.getOptionOrConfigValue("not-exist", "not-exist")
  ).toBeUndefined();
  return;
});

runTest(
  CommandService,
  async (res, service) => {
    expect(service.getOptionOrConfigValue("from-command", "from-command")).toBe(
      1
    );
    return;
  },
  undefined,
  { "from-command": 1 }
);

runTest(
  CommandService,
  async (res, service) => {
    expect(service.getOptionVlaue("from-command", "from-command")).toBe(1);
    return;
  },
  undefined,
  { "from-command": 1 }
);

runTest(CommandService, async (res, service) => {
  expect(
    service.getOptionOrConfigValue(
      "services.from-config",
      "services.from-config"
    )
  ).toBe(1);
  return;
});

runTest(CommandService, async (res, service) => {
  expect(
    service.getConfigVlaue("services.from-config", "services.from-config")
  ).toBe(1);
  return;
});

runTest(CommandService, async (res, service) => {
  expect(
    service.getOptionOrConfigValue(
      "services1.from-config",
      "services1.from-config"
    )
  ).toBeUndefined();
  return;
});

runTest(CommandService, async (res, service) => {
  expect(
    service.getOptionOrConfigValue("services.", "services.")
  ).toBeUndefined();
  return;
});
