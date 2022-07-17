import inquirer from "inquirer";
import path from "path";
import { CreatePackageService } from "../../src/services/create.services/create-package.service";
import { runTest } from "./runTest";

runTest(
  CreatePackageService,
  async (ctx, service) => {
    const pkg = {};
    await (service as any).setCliVersion(pkg);
    expect(pkg).toEqual({});
  },
  undefined,
  {
    skipEnv: true,
  }
);

runTest(
  CreatePackageService,
  async (ctx, service) => {
    const pkg = {
      dependencies: {
        "@ipare/cli": "",
      },
      devDependencies: {
        "@ipare/cli": "",
      },
    };
    await (service as any).setCliVersion(pkg);

    const cliPath = path.join(__dirname, "../..");
    expect(pkg).toEqual({
      dependencies: {
        "@ipare/cli": cliPath,
      },
      devDependencies: {
        "@ipare/cli": cliPath,
      },
    });
  },
  undefined,
  {
    cliVersion: "cli-test",
  }
);

runTest(CreatePackageService, async (ctx, service) => {
  const prompt = inquirer.prompt;
  inquirer.prompt = (() => Promise.resolve({ mng: "cnpm" })) as any;
  try {
    const mng = await (service as any).getPackageManager();
    expect(mng).toBe("cnpm");
  } finally {
    inquirer.prompt = prompt;
  }
});

runTest(CreatePackageService, async (ctx, service) => {
  await (service as any).setDeps(undefined, [], {});
});
