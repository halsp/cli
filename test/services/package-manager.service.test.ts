import inquirer from "inquirer";
import { PackageManagerService } from "../../src/services/package-manager.service";
import { runTest } from "./runTest";
import * as fs from "fs";
import path from "path";
import { parseInject } from "@halsp/inject";
import { RunnerService } from "../../src/services/runner.service";
import { runin } from "../utils";

runTest(PackageManagerService, async (ctx, service) => {
  const prompt = inquirer.prompt;
  inquirer.prompt = (() => Promise.resolve({ mng: "cnpm" })) as any;
  try {
    const result = await service.pickPackageManager();
    expect(result).toBe("cnpm");
  } finally {
    inquirer.prompt = prompt;
  }
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

  expect(fs.existsSync(path.join(dir, "package-lock.json"))).toBeTruthy();
  expect(fs.existsSync(path.join(dir, "package.json"))).toBeTruthy();
});
