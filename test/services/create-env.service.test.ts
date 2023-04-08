import inquirer from "inquirer";
import { CreateEnvService } from "../../src/services/create.services/create-env.service";
import { runTest } from "./runTest";
import { expect } from "chai";

runTest(
  CreateEnvService,
  async (ctx, service) => {
    const env = await (service as any).getEnv();
    expect(env).undefined;
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
    env.file.should.eq("lambda");
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
      (error as Error)?.message.should.eq("The env is not exist");
      err = true;
    }
    err.should.true;
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
    env.plugin.should.eq("lambda");
    env.file.should.eq("lambda");
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
    env.plugin.should.eq("native");
    env.file.should.eq("sls-http-tcloud");
  } finally {
    inquirer.prompt = prompt;
  }
});
