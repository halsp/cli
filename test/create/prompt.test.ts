import { runin } from "../utils";
import * as fs from "fs";
import { Context, HookType } from "@halsp/core";
import { CliStartup } from "../../src/cli-startup";
import { InquirerService } from "../../src/services/inquirer.service";
import { ScaffoldMiddleware } from "../../src/middlewares/create/scaffold.middleware";
import { CheckNameMiddleware } from "../../src/middlewares/create/check-name.middleware";
import { InitGitMiddleware } from "../../src/middlewares/create/init-git.middleware";
import { RunMiddleware } from "../../src/middlewares/create/run.middleware";
import { InstallMiddleware } from "../../src/middlewares/create/install.middleware";

describe("prompt", () => {
  async function runTest(options: {
    before?: (ctx: Context, md: ScaffoldMiddleware) => Promise<boolean | void>;
    after?: (ctx: Context) => Promise<void>;
    promptFn?: InquirerService["prompt"];
    force?: boolean;
    skipPlugins?: boolean;
    name?: string;
    packageManager?: string;
    override?: boolean;
  }) {
    await new CliStartup(
      "test",
      {
        name: options.name ?? ".cache-create-inquirer",
      },
      {
        packageManager: options.packageManager ?? "npm",
        registry: process.env.REGISTRY as string,
        skipInstall: true,
        skipPlugins: options.skipPlugins ?? true,
        force: options.force ?? true,
        override: options.override ?? false,
        skipEnv: true,
        debug: true,
        skipGit: true,
        skipRun: true,
      },
    )
      .use(async (ctx, next) => {
        const inquirerService = await ctx.getService(InquirerService);
        Object.defineProperty(inquirerService, "prompt", {
          value: options.promptFn ?? ((() => ({})) as any),
        });
        await next();
      })
      .hook(HookType.BeforeInvoke, async (ctx, md) => {
        if (md instanceof ScaffoldMiddleware && options.before) {
          return await options.before(ctx, md);
        }
      })
      .add(CheckNameMiddleware)
      .add(ScaffoldMiddleware)
      .add(InitGitMiddleware)
      .add(InstallMiddleware)
      .add(RunMiddleware)
      .use(async (ctx) => {
        if (options.after) {
          await options.after(ctx);
        }
      })
      .run();
  }

  it(`should ask overwrite message when prompt return { overwrite: false }`, async () => {
    await runin("test/create", async () => {
      const testName = ".cache-create-inquirer-overwrite-false-and-force-false";
      if (!fs.existsSync(testName)) {
        fs.mkdirSync(testName);
      }
      await runTest({
        promptFn: (() => Promise.resolve({ overwrite: false })) as any,
        force: false,
        name: testName,
      });

      fs.existsSync(`${testName}/package.json`).should.false;
    });
  }).timeout(1000 * 60 * 5);

  it(`should force to replace exist dir`, async () => {
    await runin("test/create", async () => {
      const testName = ".cache-create-inquirer-overwrite-false-and-force-true";
      if (!fs.existsSync(testName)) {
        fs.mkdirSync(testName);
      }
      await runTest({
        promptFn: (() => Promise.resolve({ overwrite: false })) as any,
        force: true,
        name: testName,
      });

      fs.existsSync(`${testName}/package.json`).should.true;
    });
  }).timeout(1000 * 60 * 5);

  it(`should overwrite files when use -override flag`, async () => {
    await runin("test/create", async () => {
      const testName = ".cache-create-inquirer-override";
      if (!fs.existsSync(testName)) {
        fs.mkdirSync(testName);
      }
      await runTest({
        promptFn: (() => Promise.resolve({ overwrite: false })) as any,
        force: false,
        override: true,
        name: testName,
      });

      fs.existsSync(`${testName}/package.json`).should.true;
    });
  }).timeout(1000 * 60 * 5);

  it(`should ask name if name args is empty`, async () => {
    let validate = false;
    await runin("test/create", async () => {
      const testName = ".cache-create-inquirer-ask-empty-name";
      await runTest({
        promptFn: ((args: any[]) => {
          args[0].validate("abc").should.true;
          args[0]
            .validate("invalid?\\/")
            .should.eq("Illegal name, please try again.");
          validate = true;
          return { name: testName, overwrite: false };
        }) as any,
        force: true,
        name: "",
      });

      fs.existsSync(`${testName}/package.json`).should.true;
    });
    validate.should.true;
  }).timeout(1000 * 60 * 5);

  it(`should select plugins from prompt`, async () => {
    let done = false;
    await runin("test/create", async () => {
      const testName = ".cache-create-inquirer-select-plugins";
      await runTest({
        promptFn: (() => {
          return { overwrite: false, plugins: ["view"] };
        }) as any,
        before: async (ctx, md) => {
          (await (md as any).getPlugins()).should.deep.eq(["view", "core"]);
          done = true;
          return false;
        },
        force: true,
        name: testName,
        skipPlugins: false,
      });
    });
    done.should.true;
  }).timeout(1000 * 60 * 5);

  it(`should be error when copyPackageService.create return false`, async () => {
    let done = false;
    await runin("test/create", async () => {
      const testName = ".cache-create-inquirer-copyPackageService-create";
      if (fs.existsSync(testName)) {
        await fs.promises.rm(testName, {
          force: true,
          recursive: true,
        });
      }

      await runTest({
        promptFn: (() => Promise.resolve({ overwrite: false })) as any,
        before: async (ctx, md) => {
          (md as any).copyPackageService.create = () => false;
          done = true;
        },
        force: true,
      });

      fs.existsSync(`${testName}/package.json`).should.false;
    });

    done.should.true;
  }).timeout(1000 * 60 * 5);
});
