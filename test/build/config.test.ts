import { runin, testService } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import { AssetsService } from "../../src/services/build.services/assets.service";
import { WatchCompilerService } from "../../src/services/build.services/watch-compiler.service";
import { TsconfigService } from "../../src/services/build.services/tsconfig.service";
import path from "path";
import { ConfigService } from "../../src/services/build.services/config.service";
import { Configuration, defineConfig } from "../../src";
import * as fs from "fs";
import { expect } from "chai";
import * as tsNode from "ts-node";

describe("empty-config", () => {
  it("should parse empty config", async () => {
    let callCount = 0;
    await runin(`test/build/config/empty`, async () => {
      await new CliStartup().add(BuildMiddlware).run();
      callCount++;
    });
    callCount.should.eq(1);
  });

  it(`should build and watch assets success when config is empty`, async () => {
    let callCount = 0;
    await runin(`test/build/config/empty`, async () => {
      await new CliStartup("test", undefined, { watch: true })
        .use(async (ctx, next) => {
          ctx.set("onWatchSuccess", () => {
            callCount++;
          });

          try {
            await next();
          } finally {
            const assetsService = await ctx.getService(AssetsService);
            await assetsService.stopWatch();

            const watchCompilerService =
              await ctx.getService(WatchCompilerService);
            watchCompilerService.stop();
          }
          callCount++;
        })
        .add(BuildMiddlware)
        .run();
      callCount++;
    });
    callCount.should.eq(3);
  });

  it(`should load empty config when the file is not config`, async () => {
    let worked = false;
    await runin("test/build/config/not-config", async () => {
      await new CliStartup()
        .use(async (ctx) => {
          const service = await ctx.getService(ConfigService);
          service.value.should.deep.eq({});
          worked = true;
        })
        .run();
    });
    worked.should.true;
  });
});

describe("tsconfig", () => {
  it("should parse outDir", async () => {
    await testService(
      TsconfigService,
      async (ctx, service) => {
        service.outDir
          .replace(/\\/g, "/")
          .should.eq(path.join(process.cwd(), "dist").replace(/\\/g, "/"));
      },
      {
        cwd: "test/build/tsconfig",
      },
    );
  });

  it("should be error when file from args.tsconfigPath is not exist", async () => {
    await testService(
      TsconfigService,
      async (ctx, service) => {
        (() => service.parsedCommandLine).should.throw(
          "Could not find TypeScript configuration file not-exist.json",
        );
      },
      {
        options: {
          tsconfigPath: "not-exist.json",
        },
        cwd: "test/build/tsconfig",
      },
    );
  });

  it("should parse empty tsconfig and set outDir dist", async () => {
    await testService(
      TsconfigService,
      async (ctx, service) => {
        service.outDir.should.eq("dist");
      },
      {
        options: {
          tsconfigPath: "empty.tsconfig.json",
        },
        cwd: "test/build/tsconfig",
      },
    );
  });
});

describe("read config", () => {
  it("should load config file with options.jsonConfig", async () => {
    await testService(
      ConfigService,
      async (ctx, service) => {
        (service as any).depsService.getInterfaces = (name: string) => {
          if (name == "cliConfigHook") {
            return [
              (config: Configuration) => {
                config.start = {
                  startupFile: "t1",
                };
              },
            ];
          } else {
            return [];
          }
        };

        const cfg = await (service as any).loadConfig();
        cfg.start.startupFile.should.eq("t1");
      },
      {
        options: {
          jsonConfig: `{"start":{"startupFile":"t1"}}`,
        },
        cwd: "test/build/config",
      },
    );
  });

  it("should load config file with cliConfigHook", async () => {
    await testService(
      ConfigService,
      async (ctx, service) => {
        (service as any).depsService.getInterfaces = (name: string) => {
          if (name == "cliConfigHook") {
            return [
              () => ({
                start: {
                  startupFile: "t1",
                },
              }),
            ];
          } else {
            return [];
          }
        };

        const cfg = await (service as any).loadConfig();
        cfg.start.startupFile.should.eq("t1");
      },
      {
        options: {
          jsonConfig: `{"start":{"startupFile":"t2"}}`,
        },
        cwd: "test/build/config",
      },
    );
  });

  it("should init config service when init called", async () => {
    await testService(
      ConfigService,
      async (ctx, service) => {
        await service.init();
        expect(service.mode).undefined;
        Object.keys(service.value).includes("services").should.true;
      },
      {
        cwd: "test/build/config",
      },
    );
  });

  it("should read config with custom file", async () => {
    await testService(
      ConfigService,
      async (ctx, service) => {
        await service.init();
        service.mode.should.eq("test");
        service.value.should.deep.eq({
          custom: 1,
        });
        return;
      },
      {
        options: {
          config: "custom.config.ts",
          mode: "test",
        },
        cwd: "test/build/config",
      },
    );
  });

  it(`should parse json config file`, async () => {
    let worked = false;
    await runin("test/build/config/types", async () => {
      await new CliStartup("test", undefined, {
        config: `.halsprc.json`,
      })
        .use(async (ctx) => {
          const service = await ctx.getService(ConfigService);
          service.value["type"].should.eq("json");
          worked = true;
        })
        .run();
    });
    worked.should.true;
  });

  it(`should parse json config file without ext`, async () => {
    let worked = false;
    await runin("test/build/config/types", async () => {
      await new CliStartup("test", undefined, {
        config: `.halsprc`,
      })
        .use(async (ctx) => {
          const service = await ctx.getService(ConfigService);
          service.value["type"].should.eq("json");
          worked = true;
        })
        .run();
    });
    worked.should.true;
  });

  it(`should read json config from command options`, async () => {
    let worked = false;
    await runin("test/build/config/types", async () => {
      await new CliStartup("test", undefined, {
        jsonConfig: await fs.promises.readFile(".halsprc.json", "utf-8"),
      })
        .use(async (ctx) => {
          const service = await ctx.getService(ConfigService);
          service.value["type"].should.eq("json");
          worked = true;
        })
        .run();
    });
    worked.should.true;
  });

  it(`it should read func config from command options`, async () => {
    let worked = false;
    await runin("test/build/config/types", async () => {
      const func = defineConfig(() => ({
        start: {
          startupFile: "t1",
        },
      }));
      await new CliStartup("test", undefined, {
        funcConfig: func.toString(),
      })
        .use(async (ctx) => {
          const service = await ctx.getService(ConfigService);
          service.value.start!.startupFile!.should.eq("t1");
          worked = true;
        })
        .run();
    });
    worked.should.true;
  });

  it(`should read commonjs config file`, async () => {
    let worked = false;
    await runin("test/build/config/types", async () => {
      await new CliStartup("test", undefined, {
        mode: "js-test",
        config: `.halsprc.cjs`,
      })
        .use(async (ctx) => {
          const service = await ctx.getService(ConfigService);
          service.value.start!.startupFile!.should.eq("t1");
          worked = true;
        })
        .run();
    });
    worked.should.true;
  });

  it(`should read esm js config file`, async () => {
    let worked = false;
    await runin("test/build/config/types", async () => {
      await new CliStartup("test", undefined, {
        mode: "js-test",
        config: `.halsprc.mjs`,
      })
        .use(async (ctx) => {
          const service = await ctx.getService(ConfigService);
          service.value.start!.startupFile!.should.eq("t1");
          worked = true;
        })
        .run();
    });
    worked.should.true;
  });

  it(`should load config with module.exports`, async () => {
    let worked = false;
    await runin("test/build/config/exports", async () => {
      await new CliStartup()
        .use(async (ctx) => {
          const service = await ctx.getService(ConfigService);
          service.value["exports"].should.eq(1);
          worked = true;
        })
        .run();
    });
    worked.should.true;
  });

  it("should load ts config without ts-node register", async () => {
    const register = process[tsNode.REGISTER_INSTANCE];
    delete process[tsNode.REGISTER_INSTANCE];
    try {
      await testService(
        ConfigService,
        async (ctx, service) => {
          const cfg = await (service as any).loadConfig();
          cfg.services["from-config"].should.eq(1);
        },
        {
          cwd: "test/build/config",
        },
      );
    } finally {
      process[tsNode.REGISTER_INSTANCE] = register;
    }
  });
});

describe("not-exist", () => {
  it(`should load empty config when the file not exist`, async () => {
    let worked = false;
    await runin("test/build/config/not-exist", async () => {
      await new CliStartup()
        .use(async (ctx) => {
          const service = await ctx.getService(ConfigService);
          console.log("service.mode", service.mode);
          expect(service.mode).undefined;
          service.value.should.deep.eq({});
          worked = true;
        })
        .run();
    });
    worked.should.true;
  });
});
