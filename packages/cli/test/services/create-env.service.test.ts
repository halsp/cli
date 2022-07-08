import inquirer from "inquirer";
import { CreateEnvService } from "../../src/services/create-env.service";
import { runTest } from "./runTest";

runTest(
  CreateEnvService,
  async (ctx, service) => {
    const env = await (service as any).getEnv();
    expect(env).toBeUndefined();
  },
  undefined,
  {
    skipEnv: true,
  }
);

runTest(
  CreateEnvService,
  async (ctx, service) => {
    const env = await (service as any).getEnv();
    expect(env).toBe("lambda");
  },
  undefined,
  {
    env: "lambda",
  }
);

runTest(
  CreateEnvService,
  async (ctx, service) => {
    let err = false;
    try {
      await (service as any).getEnv();
    } catch (error) {
      expect((error as Error)?.message).toBe("The env is not exist");
      err = true;
    }
    expect(err).toBeTruthy();
  },
  undefined,
  {
    env: "not-exist",
  }
);

runTest(CreateEnvService, async (ctx, service) => {
  const prompt = inquirer.prompt;
  inquirer.prompt = (() => Promise.resolve({ env: "lambda" })) as any;
  try {
    const env = await (service as any).getEnv();
    expect(env).toBe("lambda");
  } finally {
    inquirer.prompt = prompt;
  }
});
