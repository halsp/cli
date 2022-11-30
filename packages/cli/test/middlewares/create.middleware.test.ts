import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { CreateMiddleware } from "../../src/middlewares/create-middleware";
import * as fs from "fs";
import inquirer from "inquirer";
import { HookType, Context } from "@ipare/core";
import path from "path";
import { PluginConfig } from "../../src/services/create.services/plugin-config.service";

const testName = "create-cache";

//#region test template
function testTemplate(plugins: string[]) {
  const pluginsStr = plugins.join("_");
  test(
    `create template ${pluginsStr}`,
    async () => {
      const cacheDir = `test/middlewares/${testName}`;
      if (!fs.existsSync(cacheDir)) {
        await fs.promises.mkdir(cacheDir);
      }

      await runin(cacheDir, async () => {
        await new CliStartup(
          "test",
          {
            name: pluginsStr,
          },
          {
            packageManager: "npm",
            registry: process.env.REGISTRY as string,
            plugins: pluginsStr,
            force: true,
            env: "native",
            cliVersion: "../../../../",
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

const file = path.join(__dirname, "../../template/plugin.json");
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

// for (let i = 0; i < plugins.length; i++) {
//   testPlugins(i + 1);
// }

testPlugins(plugins.length);
//#endregion

type promptType = typeof inquirer.prompt;
async function runTest(options: {
  before?: (ctx: Context, md: CreateMiddleware) => Promise<boolean | void>;
  after?: (ctx: Context) => Promise<void>;
  promptFn?: promptType;
  force?: boolean;
  skipPlugins?: boolean;
  name?: string;
}) {
  const prompt = inquirer.prompt;
  inquirer.prompt = options.promptFn ?? ((() => ({})) as any);
  try {
    await new CliStartup(
      "test",
      {
        name: options.name ?? testName,
      },
      {
        packageManager: "npm",
        registry: process.env.REGISTRY as string,
        skipPlugins: options.skipPlugins ?? true,
        force: options.force ?? true,
        skipEnv: true,
        cliVersion: "../../../../",
        skipGit: true,
        skipRun: true,
      }
    )
      .hook(HookType.BeforeInvoke, async (ctx, md) => {
        if (md instanceof CreateMiddleware && options.before) {
          return await options.before(ctx, md);
        }
      })
      .add(CreateMiddleware)
      .use(async (ctx) => {
        if (options.after) {
          await options.after(ctx);
        }
      })
      .run();
  } finally {
    inquirer.prompt = prompt;
  }
}

test(
  `overwrite message`,
  async () => {
    await runin("test/middlewares", async () => {
      if (!fs.existsSync(testName)) {
        fs.mkdirSync(testName);
      }
      await runTest({
        promptFn: (() => Promise.resolve({ overwrite: false })) as any,
        force: false,
      });

      expect(fs.existsSync(`${testName}/package.json`)).toBeFalsy();
    });
  },
  1000 * 60 * 5
);

test(
  `force to replace exist dir`,
  async () => {
    await runin("test/middlewares", async () => {
      if (!fs.existsSync(testName)) {
        fs.mkdirSync(testName);
      }
      await runTest({
        promptFn: (() => Promise.resolve({ overwrite: false })) as any,
        force: true,
      });

      expect(fs.existsSync(`${testName}/package.json`)).toBeTruthy();
    });
  },
  1000 * 60 * 5
);

test(
  `ask name if name args is empty`,
  async () => {
    let validate = false;
    await runin("test/middlewares", async () => {
      await runTest({
        promptFn: ((args: any[]) => {
          expect(args[0].validate("abc")).toBeTruthy();
          expect(args[0].validate("invalid?\\/")).toBe(
            "Illegal name, please try again."
          );
          validate = true;
          return { name: testName, overwrite: false };
        }) as any,
        force: true,
        name: "",
      });

      expect(fs.existsSync(`${testName}/package.json`)).toBeTruthy();
    });
    expect(validate).toBeTruthy();
  },
  1000 * 60 * 5
);

test(
  `select plugins`,
  async () => {
    let done = false;
    await runin("test/middlewares", async () => {
      await runTest({
        promptFn: (() => {
          return { overwrite: false, plugins: ["view"] };
        }) as any,
        before: async (ctx, md) => {
          expect(await (md as any).getPlugins()).toEqual(["view", "core"]);
          done = true;
          return false;
        },
        force: true,
        name: testName,
        skipPlugins: false,
      });
    });
    expect(done).toBeTruthy();
  },
  1000 * 60 * 5
);

test(
  `create package error`,
  async () => {
    let done = false;
    await runin("test/middlewares", async () => {
      if (fs.existsSync(testName)) {
        await fs.promises.rm(testName, {
          force: true,
          recursive: true,
        });
      }

      await runTest({
        promptFn: (() => Promise.resolve({ overwrite: false })) as any,
        before: async (ctx, md) => {
          (md as any).createPackageService.create = () => false;
          done = true;
        },
        force: true,
      });

      expect(fs.existsSync(`${testName}/package.json`)).toBeFalsy();
    });

    expect(done).toBeTruthy();
  },
  1000 * 60 * 5
);
