import inquirer from "inquirer";
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
  const result = service.install("not-exist");
  console.log("result", result);
  expect(result.error).not.toBeUndefined();
  expect(result.status).toBe(1);
});
