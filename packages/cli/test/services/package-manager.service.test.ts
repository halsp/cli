import { parseInject } from "@sfajs/inject";
import inquirer from "inquirer";
import { LoadingService } from "../../src/services/loading.service";
import { PackageManagerService } from "../../src/services/package-manager.service";
import { runTest } from "./runTest";

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
  let failed: string | undefined;
  const loadingService = await parseInject(ctx, LoadingService);
  const fail = loadingService.fail;
  loadingService.fail = (msg) => {
    fail.bind(loadingService)();
    failed = msg ?? "";
  };
  await service.install("not-exist", __dirname);
  expect(failed).toBe("Installation failed");
});

runTest(PackageManagerService, async (ctx, service) => {
  const runResult = await service.run("not-exist", "install");
  expect(runResult).toBeFalsy();
});
