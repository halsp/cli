import { PackageManagerService } from "../../src/services/package-manager.service";
import { runTest } from "./runTest";
import * as fs from "fs";
import path from "path";
import { parseInject } from "@halsp/inject";
import { RunnerService } from "../../src/services/runner.service";
import { runin } from "../utils";
import { InquirerService } from "../../src/services/inquirer.service";

runTest(PackageManagerService, async (ctx, service) => {
  const inquirerService = await parseInject(ctx, InquirerService);
  Object.defineProperty(inquirerService, "prompt", {
    value: () => Promise.resolve({ mng: "cnpm" }),
  });

  const result = await service.get();
  result!.should.eq("cnpm");
});

runTest(PackageManagerService, async (ctx, service) => {
  const cahceDir = "dist";
  if (!fs.existsSync(cahceDir)) {
    await fs.promises.mkdir(cahceDir);
  }
  const dir = path.join(cahceDir, "install");
  if (fs.existsSync(dir)) {
    await fs.promises.rm(dir, {
      recursive: true,
      force: true,
    });
  }
  await fs.promises.mkdir(dir);

  const runner = await parseInject(ctx, RunnerService);
  await runin(dir, async () => {
    runner.run("npm");
    runner.run("npm", ["init", "-y"]);
    service.install("npm");
  });

  fs.existsSync(path.join(dir, "package-lock.json")).should.true;
  fs.existsSync(path.join(dir, "package.json")).should.true;
});

runTest(PackageManagerService, async (ctx, service) => {
  const inquirerService = await parseInject(ctx, InquirerService);
  Object.defineProperty(inquirerService, "prompt", {
    value: () => Promise.resolve({ mng: "cnpm" }),
  });

  const result = await service.get();
  result!.should.eq("cnpm");
});
