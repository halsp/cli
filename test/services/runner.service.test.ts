import { RunnerService } from "../../src/services/runner.service";
import { runTest } from "./runTest";

runTest(RunnerService, async (ctx, service) => {
  const runResult = service.run("not-exist");
  expect(runResult.status).toBe(1);
});

runTest(RunnerService, async (ctx, service) => {
  const runResult = service.run("not-exist", "install");
  expect(runResult.status).toBe(1);
});

runTest(RunnerService, async (ctx, service) => {
  const runResult = service.run("not-exist", ["install"]);
  expect(runResult.status).toBe(1);
});
