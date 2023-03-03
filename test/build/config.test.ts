import { runin, testService } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import { parseInject } from "@halsp/inject";
import { AssetsService } from "../../src/services/build.services/assets.service";
import { WatchCompilerService } from "../../src/services/build.services/watch-compiler.service";
import { TsconfigService } from "../../src/services/build.services/tsconfig.service";
import path from "path";
import ts from "typescript";
import { ConfigService } from "../../src/services/build.services/config.service";
import { Configuration, defineConfig } from "../../src";
import * as fs from "fs";

describe("empty-config", () => {
  it("should parse empty config", async () => {
    let callCount = 0;
    await runin(`test/build/config/empty`, async () => {
      await new CliStartup().add(BuildMiddlware).run();
      callCount++;
    });
    expect(callCount).toBe(1);
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
            const assetsService = await parseInject(ctx, AssetsService);
            await assetsService.stopWatch();

            const watchCompilerService = await parseInject(
              ctx,
              WatchCompilerService
            );
            watchCompilerService.stop();
          }
          callCount++;
        })
        .add(BuildMiddlware)
        .run();
      callCount++;
    });
    expect(callCount).toBe(3);
  });

  it(`should load empty config when the file is not config`, async () => {
    let worked = false;
    await runin("test/build/config/not-config", async () => {
      await new CliStartup()
        .use(async (ctx) => {
          const service = await parseInject(ctx, ConfigService);
          expect(service.value).toEqual({});
          worked = true;
        })
        .run();
    });
    expect(worked).toBeTruthy();
  });
});

describe("tsconfig", () => {
  it("should parse outDir", async () => {
    await testService(
      TsconfigService,
      async (ctx, service) => {
        expect(service.outDir.replace(/\\/g, "/")).toBe(
          path.join(process.cwd(), "dist").replace(/\\/g, "/")
        );
      },
      {
        cwd: "test/build/tsconfig",
      }
    );
  });

  it("should be error when file from args.tsconfigPath is not exist", async () => {
    await testService(
      TsconfigService,
      async (ctx, service) => {
        expect(() => service.parsedCommandLine).toThrowError(
          "Could not find TypeScript configuration file not-exist.json"
        );
      },
      {
        options: {
          tsconfigPath: "not-exist.json",
        },
        cwd: "test/build/tsconfig",
      }
    );
  });

  it("should parse empty tsconfig and set outDir dist", async () => {
    await testService(
      TsconfigService,
      async (ctx, service) => {
        expect(service.outDir).toBe("dist");
      },
      {
        options: {
          tsconfigPath: "empty.tsconfig.json",
        },
        cwd: "test/build/tsconfig",
      }
    );
  });

  it("should be failed when ts.getParsedCommandLineOfConfigFile return undefined", async () => {
    await testService(
      TsconfigService,
      async (ctx, service) => {
        const getParsedCommandLineOfConfigFile =
          ts.getParsedCommandLineOfConfigFile;
        try {
          ts.getParsedCommandLineOfConfigFile = () => undefined;
          expect(() => service.getParsedCommandLine()).toThrow("failed");
        } finally {
          ts.getParsedCommandLineOfConfigFile =
            getParsedCommandLineOfConfigFile;
        }
      },
      {
        cwd: "test/build/tsconfig",
      }
    );
  });
});

describe("read config", () => {
  it("should load config file with options.jsonConfig", async () => {
    await testService(
      ConfigService,
      async (ctx, service) => {
        (service as any).pluginInterfaceService.get = (name) => {
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
        expect(cfg.start.startupFile).toBe("t1");
      },
      {
        options: {
          jsonConfig: `{"start":{"startupFile":"t1"}}`,
        },
        cwd: "test/build/config",
      }
    );
  });

  it("should load config file with cliConfigHook", async () => {
    await testService(
      ConfigService,
      async (ctx, service) => {
        (service as any).pluginInterfaceService.get = (name) => {
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
        expect(cfg.start.startupFile).toBe("t1");
      },
      {
        options: {
          jsonConfig: `{"start":{"startupFile":"t2"}}`,
        },
        cwd: "test/build/config",
      }
    );
  });

  it("should init config service when init called", async () => {
    await testService(
      ConfigService,
      async (ctx, service) => {
        await service.init();
        expect(service.mode).toBeUndefined();
        expect(Object.keys(service.value).includes("services")).toBeTruthy();
      },
      {
        cwd: "test/build/config",
      }
    );
  });

  it("should read config with custom file", async () => {
    await testService(
      ConfigService,
      async (ctx, service) => {
        await service.init();
        expect(service.mode).toBe("test");
        expect(service.value).toEqual({
          custom: 1,
        });
        return;
      },
      {
        options: {
          configName: "custom.config.ts",
          mode: "test",
        },
        cwd: "test/build/config",
      }
    );
  });

  it(`should parse json config file`, async () => {
    let worked = false;
    await runin("test/build/config/types", async () => {
      await new CliStartup("test", undefined, {
        configName: `halsp-cli.config.json`,
      })
        .use(async (ctx) => {
          const service = await parseInject(ctx, ConfigService);
          expect(service.value["type"]).toBe("json");
          worked = true;
        })
        .run();
    });
    expect(worked).toBeTruthy();
  });

  test(`should read json config from command options`, async () => {
    let worked = false;
    await runin("test/build/config/types", async () => {
      await new CliStartup("test", undefined, {
        jsonConfig: await fs.promises.readFile(
          "halsp-cli.config.json",
          "utf-8"
        ),
      })
        .use(async (ctx) => {
          const service = await parseInject(ctx, ConfigService);
          expect(service.value["type"]).toBe("json");
          worked = true;
        })
        .run();
    });
    expect(worked).toBeTruthy();
  });

  test(`it should read func config from command options`, async () => {
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
          const service = await parseInject(ctx, ConfigService);
          expect(service.value.start?.startupFile).toBe("t1");
          worked = true;
        })
        .run();
    });
    expect(worked).toBeTruthy();
  });

  it(`should read js config file`, async () => {
    let worked = false;
    await runin("test/build/config/types", async () => {
      await new CliStartup("test", undefined, {
        mode: "js-test",
        configName: `halsp-cli.config.js`,
      })
        .use(async (ctx) => {
          const service = await parseInject(ctx, ConfigService);
          expect(service.value.start?.startupFile).toBe("t1");
          worked = true;
        })
        .run();
    });
    expect(worked).toBeTruthy();
  });

  it(`should load config with module.exports`, async () => {
    let worked = false;
    await runin("test/build/config/exports", async () => {
      await new CliStartup()
        .use(async (ctx) => {
          const service = await parseInject(ctx, ConfigService);
          expect(service.value["exports"]).toBe(1);
          worked = true;
        })
        .run();
    });
    expect(worked).toBeTruthy();
  });
});

describe("not-exist", () => {
  it(`should load empty config when the file not exist`, async () => {
    let worked = false;
    await runin("test/build/config/not-exist", async () => {
      await new CliStartup()
        .use(async (ctx) => {
          const service = await parseInject(ctx, ConfigService);
          expect(service.mode).toBeUndefined();
          expect(service.value).toEqual({});
          worked = true;
        })
        .run();
    });
    expect(worked).toBeTruthy();
  });
});
