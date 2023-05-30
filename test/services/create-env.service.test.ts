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
    env.flag.should.eq("lambda");
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
    value: () => Promise.resolve({ env: { plugin: "lambda", flag: "lambda" } }),
  });

  const env = await (service as any).getEnv();
  env.plugin.should.eq("lambda");
  env.flag.should.eq("lambda");
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
            env: { flag: "sls-http-tcloud", plugin: "native" },
          }),
      });
      return Promise.resolve({
        env: {
          pickMessage: "",
          children: [
            {
              flag: "lambda",
              plugin: "lambda",
            },
            {
              flag: "sls-http-tcloud",
              plugin: "native",
            },
          ],
        },
      });
    },
  });

  const env = await (service as any).getEnv();
  env.plugin.should.eq("native");
  env.flag.should.eq("sls-http-tcloud");
});
