import { CliStartup } from "../../src/cli-startup";
import { RunMiddleware } from "../../src/middlewares/create/run.middleware";
import * as fs from "fs";
import path from "path";

describe("run", () => {
  async function createCacheDir(name: string) {
    const cahceDir = "test/create/.cache-run";
    if (!fs.existsSync(cahceDir)) {
      await fs.promises.mkdir(cahceDir);
    }

    const dir = path.join(cahceDir, name);
    if (fs.existsSync(dir)) {
      await fs.promises.rm(dir, {
        recursive: true,
        force: true,
      });
    }
    await fs.promises.mkdir(dir);

    return cahceDir;
  }

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
