import { runin, testService } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import { parseInject } from "@ipare/inject";
import { AssetsService } from "../../src/services/build.services/assets.service";
import { WatchCompilerService } from "../../src/services/build.services/watch-compiler.service";
import { TsconfigService } from "../../src/services/build.services/tsconfig.service";
import path from "path";
import ts from "typescript";
import { ConfigService } from "../../src/services/build.services/config.service";
import { Configuration } from "../../src";

describe("empty-config", () => {
  it("should parse empty config", async () => {
    let callCount = 0;
    await runin(`test/build/empty-config`, async () => {
      await new CliStartup().add(BuildMiddlware).run();
      callCount++;
    });
    expect(callCount).toBe(1);
  });

  it(`should build and watch assets success when config is empty`, async () => {
    let callCount = 0;
    await runin(`test/build/empty-config`, async () => {
      await new CliStartup("test", undefined, { watch: true })
        .use(async (ctx, next) => {
          ctx.bag("onWatchSuccess", () => {
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
});
