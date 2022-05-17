import { CommandService } from "../../src/services/command.service";
import { runTest } from "./runTest";

runTest(CommandService, async (res, service) => {
  expect(service.getOptionVlaue("not-exist")).toBeUndefined();
  return;
});

runTest(
  CommandService,
  async (res, service) => {
    expect(service.getOptionVlaue("from-command")).toBe(1);
    return;
  },
  undefined,
  { "from-command": 1 }
);

runTest(CommandService, async (res, service) => {
  expect(service.getOptionVlaue("services.from-config")).toBe(1);
  return;
});

runTest(CommandService, async (res, service) => {
  expect(service.getOptionVlaue("services1.from-config")).toBeUndefined();
  return;
});

runTest(CommandService, async (res, service) => {
  expect(service.getOptionVlaue("services.")).toBeUndefined();
  return;
});
