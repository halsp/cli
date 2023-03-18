import { HookType } from "@halsp/core";
import { CliStartup } from "../../src/cli-startup";
import { CreateMiddleware } from "../../src/middlewares/create-middleware";
import * as fs from "fs";
import path from "path";
import { runin } from "../utils";

describe("git", () => {
  async function createCacheDir(name: string) {
    const cahceDir = "test/create/.cache-git";
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

  function initGit(skip: boolean) {
    it(`should init git with skip: ${skip}`, async () => {
      let worked = false;
      await new CliStartup("test", { name: "git" }, { skipGit: skip })
        .hook(HookType.BeforeInvoke, async (ctx, md) => {
          if (md instanceof CreateMiddleware) {
            const cacheDir = await createCacheDir("git");
            await runin(cacheDir, async () => {
              await (md as any).initGit();
            });
            expect(fs.existsSync(path.join(cacheDir, "git", ".git"))).toBe(
              !skip
            );
            worked = true;
          }
          return false;
        })
        .add(CreateMiddleware)
        .run();

      expect(worked).toBeTruthy();
    });
  }
  initGit(true);
  initGit(false);
});
