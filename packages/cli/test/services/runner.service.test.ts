import { runTest } from "./runTest";
import * as fs from "fs";
import path from "path";
import { RunnerService } from "../../src/services/runner.service";

runTest(RunnerService, async (ctx, service) => {
  const cahceDir = "dist";
  if (!fs.existsSync(cahceDir)) {
    await fs.promises.mkdir(cahceDir);
  }
  const dir = path.join(__dirname, cahceDir, "runner");
  if (fs.existsSync(dir)) {
    await fs.promises.rm(dir, {
      recursive: true,
      force: true,
    });
  }
  await fs.promises.mkdir(dir);

  service.run("npm", undefined, {
    cwd: dir,
  });
  service.run("npm", ["-v"], {
    cwd: dir,
  });
});
