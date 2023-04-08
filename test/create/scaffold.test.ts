import { runin, testService } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { CreateMiddleware } from "../../src/middlewares/create-middleware";
import * as fs from "fs";
import path from "path";
import {
  PluginConfig,
  SortedPluginConfig,
} from "../../src/services/create.services/plugin-config.service";
import { parseInject } from "@halsp/inject";
import { CreateScaffoldService } from "../../src/services/create.services/create-scaffold.service";
import { HookType } from "@halsp/core";

describe("scaffold", () => {
  const testName = ".cache-scaffold-create";

  function testTemplate(plugins: string[]) {
    const pluginsStr = plugins.join("_");
    it(
      `should create app with plugins ${pluginsStr}`,
      async () => {
        const cacheDir = `test/create/${testName}_${pluginsStr}`;
        if (!fs.existsSync(cacheDir)) {
          await fs.promises.mkdir(cacheDir);
        }

        await runin(cacheDir, async () => {
          await new CliStartup(
            "test",
            {
              name: "test",
            },
            {
              packageManager: "npm",
              registry: process.env.REGISTRY as string,
              plugins: pluginsStr,
              force: true,
              env: "native",
              debug: true,
              skipGit: true,
              skipRun: true,
            }
          )
            .add(CreateMiddleware)
            .run();
        });

        expect(fs.existsSync(cacheDir)).toBeTruthy();
        await fs.promises.rm(cacheDir, {
          recursive: true,
          force: true,
        });
      },
      1000 * 60 * 5
    );
  }

  const file = path.join(__dirname, "../../scaffold/plugin.json");
  const content = fs.readFileSync(file, "utf-8");
  const config: PluginConfig = JSON.parse(content);

  const plugins = config.plugins.map((item) => item.name);
  function selectPlugins(count: number, startIndex = 0): string[][] {
    if (count < 1) return [];
    if (startIndex + count > plugins.length) return [];

    const result: string[][] = [];
    for (let i = startIndex; i <= plugins.length - count; i++) {
      const first = plugins[i];
      const remain = selectPlugins(count - 1, i + 1);
      if (remain.length) {
        remain.forEach((ps) => result.push([first, ...ps]));
      } else {
        result.push([first]);
      }
    }
    return result;
  }

  function testPlugins(count: number) {
    const sels = selectPlugins(count);
    for (const sel of sels) {
      testTemplate(sel);
    }
  }

  // ergodic
  // for (let i = 0; i < plugins.length; i++) {
  //   testPlugins(i + 1);
  // }

  testPlugins(plugins.length);
});

describe("mock scaffold", () => {
  async function testTemplate(
    fn: (service: CreateScaffoldService) => void | Promise<void>
  ) {
    let worked = false;
    await runin("test/create/mock-scaffold", async () => {
      await new CliStartup("test", { name: "test" })
        .use(async (ctx) => {
          const service = await parseInject(ctx, CreateScaffoldService);

          if (!fs.existsSync("dist")) {
            fs.mkdirSync("dist");
          }

          await fn(service);
          worked = true;
        })
        .run();
    });
    expect(worked).toBeTruthy();
  }

  async function testScaffoldDefault(
    plugins: string[],
    file: string,
    fn: (text?: string) => void | Promise<void>,
    beforeFn?: () => void | Promise<void>
  ) {
    await testTemplate(async (service) => {
      fs.rmSync("./dist/scaffold", {
        recursive: true,
        force: true,
      });

      if (beforeFn) {
        await beforeFn();
      }

      expect((service["targetDir"] as string).endsWith("test")).toBeTruthy();

      function defineDir(service: any) {
        Object.defineProperty(service, "targetDir", {
          get: () => path.join(process.cwd(), "dist/scaffold"),
        });
        Object.defineProperty(service, "sourceDir", {
          get: () => path.join(process.cwd(), "scaffold"),
        });
      }
      defineDir(service);
      defineDir(service["copyIgnoreService"]);

      await service.create(plugins);
      expect(fs.existsSync("dist")).toBeTruthy();

      if (fs.existsSync(`dist/scaffold/${file}`)) {
        const text = fs.readFileSync(`dist/scaffold/${file}`, "utf-8");
        await fn(text);
      } else {
        await fn(undefined);
      }
    });
  }

  async function testContains(contains: boolean) {
    it(`should contains children plugins: ${contains}`, async () => {
      await testScaffoldDefault(
        contains ? ["router", "mva"] : ["router"],
        "contains.ts",
        (text) => {
          if (contains) {
            expect(text?.trim()?.split("\n")?.at(0)?.trim()).toBe(
              "// ROUTER_CONTENT"
            );
          } else {
            expect(text?.trim()?.split("\n")?.at(0)?.trim()).toBe(
              "// CONTAINS_CONTENT"
            );
          }
        }
      );
    });
  }
  testContains(true);
  testContains(false);

  async function testSelect(select: boolean) {
    it(`should select code by plugins: ${select}`, async () => {
      await testScaffoldDefault(
        [select ? "inject" : "router"],
        "select.ts",
        (text) => {
          if (select) {
            expect(text?.trim()).toBe("// INJECT_CONTENT");
          } else {
            expect(text).toBeUndefined();
          }
        }
      );
    });
  }
  testSelect(true);
  testSelect(false);

  it(`should parse files with crlf format`, async () => {
    await testScaffoldDefault(
      [],
      "crlf.txt",
      (text) => {
        expect(text).toBe("a\r\nb");
      },
      () => {
        fs.writeFileSync("./scaffold/crlf.txt", "a\r\nb");
      }
    );
  });

  it(`should create project with default scaffold`, async () => {
    await testTemplate(async (service) => {
      fs.rmSync("./dist/default", {
        recursive: true,
        force: true,
      });

      Object.defineProperty(service, "targetDir", {
        get: () => path.join(process.cwd(), "dist/default"),
      });
      Object.defineProperty(service["copyIgnoreService"], "targetDir", {
        get: () => path.join(process.cwd(), "dist/default"),
      });
      await service.create([]);
      expect(fs.existsSync("dist/default")).toBeTruthy();
      expect(fs.existsSync("dist/default/.eslintrc.js")).toBeTruthy();
      expect(fs.existsSync("dist/default/jest.config.js")).toBeTruthy();
    });
  });

  function testChildren(childrenEnable: boolean) {
    it(`should select code with children plugins: ${childrenEnable}`, async () => {
      await testScaffoldDefault(
        childrenEnable ? ["router", "filter"] : ["router"],
        "children.ts",
        (text) => {
          if (childrenEnable) {
            expect(text?.trim()).toBe("// ROUTER_CONTENT\n// FILTER_CONTENT");
          } else {
            expect(text?.trim()).toBe("// ROUTER_CONTENT");
          }
        }
      );
    });
  }
  testChildren(true);
  testChildren(false);

  it(`should not copy codes when scaffold sourceDir is not exist`, async () => {
    await testTemplate((service) => {
      fs.rmSync("./dist/not-exist", {
        recursive: true,
        force: true,
      });

      function defineDir(service: any) {
        Object.defineProperty(service, "targetDir", {
          get: () => path.join(process.cwd(), "dist/not-exist"),
        });
        Object.defineProperty(service, "sourceDir", {
          get: () => path.join(process.cwd(), "not-exist"),
        });
      }
      defineDir(service);
      defineDir(service["copyIgnoreService"]);

      expect(fs.existsSync("dist/not-exist")).toBeFalsy();
    });
  });

  it(`should not copy codes when scaffold sourceDir is error`, async () => {
    await testTemplate(async (service) => {
      Object.defineProperty(service, "sourceDir", {
        get: () => path.join(process.cwd(), "dist/not-exist"),
      });
      Object.defineProperty(service["copyIgnoreService"], "sourceDir", {
        get: () => path.join(process.cwd(), "dist/not-exist"),
      });

      await service.create([]);
      expect(fs.existsSync("dist/not-exist")).toBeFalsy();
    });
  });

  it(`should rename file when there is rename flat`, async () => {
    await testScaffoldDefault([], "new-name.ts", (text) => {
      expect(text?.trim()).toBe("1;");
    });
  });

  it(`should not rename file when there is rename flat and target is empty`, async () => {
    await testScaffoldDefault([], "rename-empty.ts", (text) => {
      expect(text?.trim()).toBe("1;");
    });
  });
});

describe("error", () => {
  it("should be error when CreateScaffoldService.create return false", async () => {
    await runin("test/create", async () => {
      const testName = ".cache-create-scaffold-return-false";
      if (fs.existsSync(testName)) {
        fs.rmSync(testName, {
          recursive: true,
          force: true,
        });
      }

      await new CliStartup(
        "test",
        {
          name: testName,
        },
        {
          packageManager: "npm",
          force: true,
          registry: process.env.REGISTRY as string,
        }
      )
        .hook(HookType.BeforeInvoke, (ctx, md) => {
          md["createScaffoldService"]["init"] = () => false;
          return true;
        })
        .add(CreateMiddleware)
        .run();
      expect(fs.existsSync(testName)).toBeTruthy();
      expect(fs.existsSync(testName + "/package.json")).toBeFalsy();
    });
  });

  it("should stop create when install error", async () => {
    await runin("test/create", async () => {
      const testName = ".cache-create-install-error";
      if (fs.existsSync(testName)) {
        fs.rmSync(testName, {
          recursive: true,
          force: true,
        });
      }

      await new CliStartup(
        "test",
        {
          name: testName,
        },
        {
          packageManager: "npm",
          force: true,
          skipPlugins: true,
          skipEnv: true,
          registry: process.env.REGISTRY as string,
        }
      )
        .hook(HookType.BeforeInvoke, (ctx, md) => {
          md["install"] = () => false;
          return true;
        })
        .add(CreateMiddleware)
        .run();
      expect(fs.existsSync(testName)).toBeTruthy();
      expect(fs.existsSync(testName + "/node_modules")).toBeFalsy();
    });
  });
});

describe("init", () => {
  function getCliVersion() {
    const file = path.join(__dirname, "../../package.json");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(file).version;
  }
  const modulesPath = path.join(__dirname, "../../scaffold/node_modules");
  const flagPath = path.join(modulesPath, getCliVersion());

  it(
    "should init scaffold node_modules",
    async () => {
      await testService(
        CreateScaffoldService,
        async (ctx, service) => {
          if (fs.existsSync(flagPath)) {
            await fs.promises.rm(flagPath);
          }
          await service.init("npm");
          expect(fs.existsSync(flagPath)).toBeTruthy();

          await service.init("npm");
          expect(fs.existsSync(flagPath)).toBeTruthy();
        },
        {
          options: {
            registry: process.env.REGISTRY as string,
            skipInstall: true,
          },
        }
      );
    },
    1000 * 60 * 5
  );

  it(
    "should init scaffold node_modules with forceInit",
    async () => {
      await testService(
        CreateScaffoldService,
        async (ctx, service) => {
          await service.init("npm");
          expect(fs.existsSync(flagPath)).toBeTruthy();
        },
        {
          options: {
            registry: process.env.REGISTRY as string,
            skipInstall: true,
            forceInit: true,
          },
        }
      );
    },
    1000 * 60 * 5
  );

  it(
    "should sort plugin with config",
    async () => {
      await testService(
        CreateScaffoldService,
        async (ctx, service) => {
          (service as any).pluginConfigService = {
            getSortedConfig: () => {
              return {
                dependencies: {
                  "@halsp/view": true,
                },
                devDependencies: {
                  "@halsp/router": true,
                },
              } as Partial<SortedPluginConfig>;
            },
          } as any;
          const plugins = await service["sortPlugins"]([]);
          expect(plugins).toEqual(["view", "router", "core", "methods", "cli"]);
        },
        {
          options: {
            registry: process.env.REGISTRY as string,
            skipInstall: true,
          },
        }
      );
    },
    1000 * 60 * 5
  );
});
