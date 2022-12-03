import { runin } from "../utils";
import * as fs from "fs";
import inquirer from "inquirer";
import { HookType, Context } from "@ipare/core";
import { CreateMiddleware } from "../../src/middlewares/create-middleware";
import { CliStartup } from "../../src/cli-startup";

describe("prompt", () => {
  type promptType = typeof inquirer.prompt;
  async function runTest(options: {
    before?: (ctx: Context, md: CreateMiddleware) => Promise<boolean | void>;
    after?: (ctx: Context) => Promise<void>;
    promptFn?: promptType;
    force?: boolean;
    skipPlugins?: boolean;
    name?: string;
    packageManager?: string;
  }) {
    const prompt = inquirer.prompt;
    inquirer.prompt = options.promptFn ?? ((() => ({})) as any);
    try {
      await new CliStartup(
        "test",
        {
          name: options.name ?? ".ipare-cache-create-inquirer",
        },
        {
          packageManager: options.packageManager ?? "npm",
          registry: process.env.REGISTRY as string,
          skipPlugins: options.skipPlugins ?? true,
          force: options.force ?? true,
          skipEnv: true,
          debug: true,
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

  it(
    `should overwrite message when prompt return { overwrite: false }`,
    async () => {
      await runin("test/create", async () => {
        const testName = ".ipare-cache-create-inquirer-overwrite-false";
        if (!fs.existsSync(testName)) {
          fs.mkdirSync(testName);
        }
        await runTest({
          promptFn: (() => Promise.resolve({ overwrite: false })) as any,
          force: false,
          name: testName,
        });

        expect(fs.existsSync(`${testName}/package.json`)).toBeFalsy();
      });
    },
    1000 * 60 * 5
  );

  it(
    `should force to replace exist dir`,
    async () => {
      await runin("test/create", async () => {
        const testName = ".ipare-cache-create-inquirer-overwrite-true";
        if (!fs.existsSync(testName)) {
          fs.mkdirSync(testName);
        }
        await runTest({
          promptFn: (() => Promise.resolve({ overwrite: false })) as any,
          force: true,
          name: testName,
        });

        expect(fs.existsSync(`${testName}/package.json`)).toBeTruthy();
      });
    },
    1000 * 60 * 5
  );

  it(
    `should ask name if name args is empty`,
    async () => {
      let validate = false;
      await runin("test/create", async () => {
        const testName = ".ipare-cache-create-inquirer-ask-empty-name";
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

  it(
    `should select plugins from prompt`,
    async () => {
      let done = false;
      await runin("test/create", async () => {
        const testName = ".ipare-cache-create-inquirer-select-plugins";
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

  it(
    `should be error when createPackageService.create return false`,
    async () => {
      let done = false;
      await runin("test/create", async () => {
        const testName =
          ".ipare-cache-create-inquirer-createPackageService-create";
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

  it(
    `should select package manager by prompt`,
    async () => {
      await runin("test/create", async () => {
        const testName = ".ipare-cache-create-inquirer-select-pm";
        await runTest({
          promptFn: (() => Promise.resolve({ mng: "cnpm" })) as any,
          name: testName,
          packageManager: "",
          before: async (ctx, md) => {
            const mng = await md["getPackageManager"]();
            expect(mng).toBe("cnpm");
            return false;
          },
        });
      });
    },
    1000 * 60 * 5
  );

  it(
    `should select package manager by prompt`,
    async () => {
      await runin("test/create", async () => {
        const testName = ".ipare-cache-create-inquirer-select-pm-null";
        await runTest({
          promptFn: (() => Promise.resolve({ mng: null })) as any,
          name: testName,
          packageManager: "",
        });

        expect(fs.existsSync(`${testName}/package.json`)).toBeFalsy();
      });
    },
    1000 * 60 * 5
  );
});
