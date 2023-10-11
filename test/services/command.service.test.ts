import { CommandService } from "../../src/services/command.service";
import { ConfigService } from "../../src/services/build.services/config.service";
import { runTest } from "./runTest";
import { expect } from "chai";

runTest(ConfigService, async (ctx, service) => {
  expect(service.getOptionOrConfigValue("not-exist", "not-exist")).undefined;
  return;
});

runTest(
  ConfigService,
  async (ctx, service) => {
    service.getOptionOrConfigValue("from-command", "from-command").should.eq(1);
    return;
  },
  undefined,
  undefined,
  { "from-command": 1 },
);

runTest(
  CommandService,
  async (ctx, service) => {
    service.getOptionVlaue("from-command", "from-command").should.eq(1);
    return;
  },
  undefined,
  undefined,
  { "from-command": 1 },
);

runTest(ConfigService, async (ctx, service) => {
  service
    .getOptionOrConfigValue("services.from-config", "services.from-config")
    .should.eq(1);
  return;
});

runTest(ConfigService, async (ctx, service) => {
  service
    .getConfigValue("services.from-config", "services.from-config")
    .should.eq(1);
  return;
});

runTest(ConfigService, async (ctx, service) => {
  expect(
    service.getOptionOrConfigValue(
      "services1.from-config",
      "services1.from-config",
    ),
  ).undefined;
  return;
});

runTest(ConfigService, async (ctx, service) => {
  expect(service.getOptionOrConfigValue("services.", "services.")).undefined;
  return;
});
