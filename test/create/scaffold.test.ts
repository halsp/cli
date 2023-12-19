import { runin, testService } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { ScaffoldMiddleware } from "../../src/middlewares/create/scaffold.middleware";
import { CheckNameMiddleware } from "../../src/middlewares/create/check-name.middleware";
import { InitGitMiddleware } from "../../src/middlewares/create/init-git.middleware";
import { RunMiddleware } from "../../src/middlewares/create/run.middleware";
import { InstallMiddleware } from "../../src/middlewares/create/install.middleware";
import * as fs from "fs";
import path from "path";
import {
  PluginConfig,
  SortedPluginConfig,
} from "../../src/services/scaffold.services/plugin-config.service";
import { CopyScaffoldService } from "../../src/services/scaffold.services/copy-scaffold.service";
import { HookType } from "@halsp/core";
import { expect } from "chai";
import { InitService } from "../../src/services/scaffold.services/init.service";

describe("scaffold", () => {
  const testName = ".cache-scaffold-create";

  function testTemplate(plugins: string[]) {
    const pluginsStr = plugins.join("_");
    it(`should create app with plugins ${pluginsStr}`, async () => {
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
            registry: process.env.REGISTRY || "https://registry.npmjs.org/",
            plugins: pluginsStr,
            force: true,
            env: "native",
            debug: true,
            skipGit: true,
            skipRun: true,
          },
        )
          .add(CheckNameMiddleware)
          .add(ScaffoldMiddleware)
          .add(InitGitMiddleware)
          .add(InstallMiddleware)
          .add(RunMiddleware)
          .run();
      });

      fs.existsSync(cacheDir).should.true;
      await fs.promises.rm(cacheDir, {
        recursive: true,
        force: true,
      });
    }).timeout(1000 * 60 * 5);
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
    fn: (service: CopyScaffoldService) => void | Promise<void>,
  ) {
    let worked = false;
    await runin("test/create/mock-scaffold", async () => {
      await new CliStartup("test", { name: "test" })
        .use(async (ctx) => {
          const service = await ctx.getService(CopyScaffoldService);

          if (!fs.existsSync("dist")) {
            fs.mkdirSync("dist");
          }

          await fn(service);
          worked = true;
        })
        .run();
    });
    worked.should.true;
  }

  async function testScaffoldDefault(
    plugins: string[],
    file: string,
    fn: (text?: string) => void | Promise<void>,
    beforeFn?: () => void | Promise<void>,
  ) {
    await testTemplate(async (service) => {
      fs.rmSync("./dist/scaffold", {
        recursive: true,
        force: true,
      });

      if (beforeFn) {
        await beforeFn();
      }

      (service["targetDir"] as string).endsWith("test").should.true;

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
      fs.existsSync("dist").should.true;

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
            text!
              .trim()
              .split("\n")
              .at(0)!
              .trim()
              .should.eq("// ROUTER_CONTENT");
          } else {
            text!
              .trim()
              .split("\n")
              .at(0)!
              .trim()
              .should.eq("// CONTAINS_CONTENT");
          }
        },
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
            text?.trim().should.eq("// INJECT_CONTENT");
          } else {
            expect(text).undefined;
          }
        },
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
        text!.should.eq("a\r\nb");
      },
      () => {
        fs.writeFileSync("./scaffold/crlf.txt", "a\r\nb");
      },
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
      fs.existsSync("dist/default").should.true;
      fs.existsSync("dist/default/.eslintrc.js").should.true;
    });
  });

  function testChildren(childrenEnable: boolean) {
    it(`should select code with children plugins: ${childrenEnable}`, async () => {
      await testScaffoldDefault(
        childrenEnable ? ["router", "filter"] : ["router"],
        "children.ts",
        (text) => {
          if (childrenEnable) {
            text?.trim().should.eq("// ROUTER_CONTENT\n// FILTER_CONTENT");
          } else {
            text?.trim().should.eq("// ROUTER_CONTENT");
          }
        },
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

      fs.existsSync("dist/not-exist").should.false;
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
      fs.existsSync("dist/not-exist").should.false;
    });
  });

  it(`should rename file when there is rename flat`, async () => {
    await testScaffoldDefault([], "new-name.ts", (text) => {
      text?.trim().should.eq("1;");
    });
  });

  it(`should not rename file when there is rename flat and target is empty`, async () => {
    await testScaffoldDefault([], "rename-empty.ts", (text) => {
      text?.trim().should.eq("1;");
    });
  });

  function testReplace(http: boolean) {
    function test(micro: boolean) {
      const plugins: string[] = [];
      if (http) plugins.push("http");
      if (micro) plugins.push("micro");
      it(`replace code with plugins: ${plugins.join(",")}`, async () => {
        await testScaffoldDefault(plugins, "replace.ts", (text) => {
          if (http && micro) {
            text?.trim().should.eq("const a = 2;");
          } else if (!http && micro) {
            text?.trim().should.eq("const a = 5;");
          } else if (http && !micro) {
            text?.trim().should.eq("const a = 4;");
          } else {
            text?.trim().should.eq("const a = 3;");
          }
        });
      });
    }
    test(true);
    test(false);
  }
  testReplace(true);
  testReplace(false);

  it("should exec command in code", async () => {
    await testScaffoldDefault([], "exec-command.json", (text) => {
      const json = JSON.parse(text!);
      json.should.deep.eq({
        ctx: {}.toString(),
        opts: "name",
        empty: "",
        escape: "$$",
      });
    });
  });
});

describe("error", () => {
  it("should be error when CopyScaffoldService.create return false", async () => {
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
        },
      )
        .hook(HookType.BeforeInvoke, (ctx, md) => {
          if (md instanceof ScaffoldMiddleware) {
            md["initService"]["init"] = async () => false;
          }
          return true;
        })
        .add(CheckNameMiddleware)
        .add(ScaffoldMiddleware)
        .add(InitGitMiddleware)
        .add(InstallMiddleware)
        .add(RunMiddleware)
        .run();
      fs.existsSync(testName).should.false;
    });
  });

  it("should be failed when install error", async () => {
    await runin("test/create", async () => {
      const testName = ".cache-create-scaffold-install-failed";
      if (fs.existsSync(testName)) {
        fs.rmSync(testName, {
          recursive: true,
          force: true,
        });
      }

      const { ctx } = await new CliStartup(
        "test",
        {
          name: testName,
        },
        {
          packageManager: "npm",
          force: true,
        },
      )
        .hook(HookType.BeforeInvoke, (ctx, md) => {
          if (md instanceof InstallMiddleware) {
            md["packageManagerService"]["install"] = (async () => {
              return {
                status: -1,
              };
            }) as any;
          }
          return true;
        })
        .add(InstallMiddleware)
        .use(async (ctx) => {
          ctx.set("end", true);
        })
        .run();
      expect(ctx.get("end")).undefined;
    });
  });
});

describe("init", () => {
  function getCliVersion() {
    const file = path.join(__dirname, "../../package.json");
    return _require(file).version;
  }
  const modulesPath = path.join(__dirname, "../../scaffold/node_modules");
  const flagPath = path.join(modulesPath, getCliVersion());

  it("should init scaffold node_modules", async () => {
    await testService(
      InitService,
      async (ctx, service) => {
        if (fs.existsSync(flagPath)) {
          await fs.promises.rm(flagPath);
        }
        await service.init("npm");
        fs.existsSync(flagPath).should.true;

        await service.init("npm");
        fs.existsSync(flagPath).should.true;
      },
      {
        options: {
          registry: process.env.REGISTRY as string,
          skipInstall: true,
        },
      },
    );
  }).timeout(1000 * 60 * 5);

  it("should init scaffold node_modules with forceInit", async () => {
    await testService(
      InitService,
      async (ctx, service) => {
        await service.init("npm");
        fs.existsSync(flagPath).should.true;
      },
      {
        options: {
          registry: process.env.REGISTRY as string,
          skipInstall: true,
          forceInit: true,
        },
      },
    );
  }).timeout(1000 * 60 * 5);

  it("should sort plugin with config", async () => {
    await testService(
      CopyScaffoldService,
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
        plugins.should.deep.eq(["view", "router", "core", "cli"]);
      },
      {
        options: {
          registry: process.env.REGISTRY as string,
          skipInstall: true,
        },
      },
    );
  }).timeout(1000 * 60 * 5);
});
