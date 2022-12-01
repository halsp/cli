import { HookType } from "@ipare/core";
import { CliStartup } from "../../src/cli-startup";
import { CreateMiddleware } from "../../src/middlewares/create-middleware";
import * as fs from "fs";
import path from "path";
import { runin } from "../utils";

describe("run", () => {
  async function createCacheDir(name: string) {
    const cahceDir = "test/create/.ipare-cache-run";
    if (!fs.existsSync(cahceDir)) {
      await fs.promises.mkdir(cahceDir);
    }

    const dir = path.join(cahceDir, name);
    if (fs.existsSync(dir)) {
      await fs.promises.rm(dir, {
        recursive: true,
        force: true,
      });
    }
    await fs.promises.mkdir(dir);

    return cahceDir;
  }

  function runApp(skip: boolean) {
    it(`should run app with skip: ${skip}`, async () => {
      let worked = false;
      await new CliStartup("test", { name: "runApp" }, { skipGit: skip })
        .hook(HookType.BeforeInvoke, async (ctx, md) => {
          if (md instanceof CreateMiddleware) {
            const cacheDir = await createCacheDir("runApp");
            await runin(cacheDir, async () => {
              await (md as any).runApp();
            });
            worked = true;
          }
          return false;
        })
        .add(CreateMiddleware)
        .run();

      expect(worked).toBeTruthy();
    });
  }
  runApp(true);
  runApp(false);
});
