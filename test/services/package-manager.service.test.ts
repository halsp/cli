import { PackageManagerService } from "../../src/services/package-manager.service";
import { runTest } from "./runTest";
import * as fs from "fs";
import path from "path";
import { RunnerService } from "../../src/services/runner.service";
import { runin } from "../utils";
import { InquirerService } from "../../src/services/inquirer.service";

async function createCacheDir(name: string) {
  const dir = path.join(__dirname, ".cache-pm", name);
  if (fs.existsSync(dir)) {
    await fs.promises.rm(dir, {
      recursive: true,
      force: true,
    });
  }
  await fs.promises.mkdir(dir, {
    recursive: true,
  });
  return dir;
}

runTest(PackageManagerService, async (ctx, service) => {
  const inquirerService = await ctx.getService(InquirerService);
  Object.defineProperty(inquirerService, "prompt", {
    value: () => Promise.resolve({ mng: "cnpm" }),
  });

  const result = await service.get();
  result!.should.eq("cnpm");
});

runTest(PackageManagerService, async (ctx, service) => {
  const inquirerService = await ctx.getService(InquirerService);
  Object.defineProperty(inquirerService, "prompt", {
    value: () => Promise.resolve({ mng: "cnpm" }),
  });

  const result = await service.get();
  result!.should.eq("cnpm");
});

runTest(PackageManagerService, async (ctx, service) => {
  const dir = await createCacheDir("install");

  const runner = await ctx.getService(RunnerService);
  await runin(dir, async () => {
    runner.run("npm");
    runner.run("npm", ["init", "-y"]);
    await service.install("npm");
  });

  fs.existsSync(path.join(dir, "package-lock.json")).should.true;
  fs.existsSync(path.join(dir, "package.json")).should.true;
});

runTest(PackageManagerService, async (ctx, service) => {
  const dir = await createCacheDir("add");

  const runner = await ctx.getService(RunnerService);
  await runin(dir, async () => {
    runner.run("npm");
    runner.run("npm", ["init", "-y"]);
    await service.add("npm", "npm");
  });

  const pkg = await fs.promises.readFile(
    path.join(dir, "package.json"),
    "utf-8",
  );
  const json = JSON.parse(pkg);
  (!!json.dependencies.npm).should.true;
});

runTest(PackageManagerService, async (ctx, service) => {
  const dir = await createCacheDir("uninstall");

  const runner = await ctx.getService(RunnerService);
  await runin(dir, async () => {
    runner.run("npm");
    runner.run("npm", ["init", "-y"]);
    await service.add("npm", "npm");
    await service.uninstall("npm");
  });

  const pkg = await fs.promises.readFile(
    path.join(dir, "package.json"),
    "utf-8",
  );
  const json = JSON.parse(pkg);
  (!!json.dependencies?.npm).should.false;
});
