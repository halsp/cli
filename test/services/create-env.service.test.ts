import inquirer from "inquirer";
import { CreateEnvService } from "../../src/services/create.services/create-env.service";
import { runTest } from "./runTest";

runTest(
  CreateEnvService,
  async (ctx, service) => {
    const env = await (service as any).getEnv();
    expect(env).toBeUndefined();
  },
  undefined,
  undefined,
  {
    skipEnv: true,
  }
);

runTest(
  CreateEnvService,
  async (ctx, service) => {
    const env = await (service as any).getEnv();
    expect(env.file).toBe("lambda");
  },
  undefined,
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
  undefined,
  {
    env: "not-exist",
  }
);

runTest(CreateEnvService, async (ctx, service) => {
  const prompt = inquirer.prompt;
  inquirer.prompt = (() =>
    Promise.resolve({ env: { plugin: "lambda", file: "lambda" } })) as any;
  try {
    const env = await (service as any).getEnv();
    expect(env.plugin).toBe("lambda");
    expect(env.file).toBe("lambda");
  } finally {
    inquirer.prompt = prompt;
  }
});

runTest(CreateEnvService, async (ctx, service) => {
  const prompt = inquirer.prompt;
  inquirer.prompt = (() => {
    inquirer.prompt = (() =>
      Promise.resolve({
        env: { file: "sls-http-tcloud", plugin: "native" },
      })) as any;
    return Promise.resolve({
      env: {
        pickMessage: "",
        children: [
          {
            file: "lambda",
            plugin: "lambda",
          },
          {
            file: "sls-http-tcloud",
            plugin: "native",
          },
        ],
      },
    });
  }) as any;
  try {
    const env = await (service as any).getEnv();
    expect(env.plugin).toBe("native");
    expect(env.file).toBe("sls-http-tcloud");
  } finally {
    inquirer.prompt = prompt;
  }
});
