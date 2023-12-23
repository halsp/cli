import { CliStartup } from "../../src/cli-startup";
import { RunMiddleware } from "../../src/middlewares/create/run.middleware";

describe("run", () => {
  function runApp(skip: boolean) {
    it(`should run app with skip: ${skip}`, async () => {
      await new CliStartup("test", { name: "runApp" }, { skipRun: skip })
        .add(RunMiddleware)
        .run();
    });
  }
  runApp(true);
  runApp(false);
});
