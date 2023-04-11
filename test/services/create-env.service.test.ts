import { CreateEnvService } from "../../src/services/scaffold.services/create-env.service";
import { runTest } from "./runTest";
import { expect } from "chai";
import { InquirerService } from "../../src/services/inquirer.service";
import { parseInject } from "@halsp/inject";

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
  const inquirerService = await parseInject(ctx, InquirerService);
  Object.defineProperty(inquirerService, "prompt", {
    value: () => Promise.resolve({ env: { plugin: "lambda", file: "lambda" } }),
  });

  const env = await (service as any).getEnv();
  env.plugin.should.eq("lambda");
  env.file.should.eq("lambda");
});

runTest(CreateEnvService, async (ctx, service) => {
  const inquirerService = await parseInject(ctx, InquirerService);
  Object.defineProperty(inquirerService, "prompt", {
    writable: true,
    value: () => {
      Object.defineProperty(inquirerService, "prompt", {
        writable: true,
        value: () =>
          Promise.resolve({
            env: { file: "sls-http-tcloud", plugin: "native" },
          }),
      });
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
    },
  });

  const env = await (service as any).getEnv();
  env.plugin.should.eq("native");
  env.file.should.eq("sls-http-tcloud");
});
