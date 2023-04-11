import { CliStartup } from "../../src/cli-startup";
import { InitGitMiddleware } from "../../src/middlewares/create/init-git.middleware";
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
      const cacheDir = await createCacheDir("git");
      await runin(cacheDir, async () => {
        await new CliStartup("test", { name: "git" }, { skipGit: skip })
          .add(InitGitMiddleware)
          .run();
      });
      fs.existsSync(path.join(cacheDir, "git", ".git")).should.eq(!skip);
    });
  }
  initGit(true);
  initGit(false);
});
