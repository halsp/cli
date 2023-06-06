import * as fs from "fs";
import path from "path";
import { CliStartup } from "../../src/cli-startup";
import { CopyIgnoreService } from "../../src/services/scaffold.services/copy-ignore.service";
import { runin } from "../utils";

describe("copy ignore", () => {
  async function runTest(
    dir: string,
    sourceFile: string | undefined,
    targetExist: boolean
  ) {
    dir = ".cache-copy-ignore-" + dir;
    await runin("test/create", async () => {
      fs.rmSync(dir, {
        recursive: true,
        force: true,
      });
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      fs.rmSync(dir + "-target", {
        recursive: true,
        force: true,
      });
      if (!fs.existsSync(dir + "-target")) {
        fs.mkdirSync(dir + "-target");
      }
      if (sourceFile) {
        fs.writeFileSync(path.join(dir, sourceFile), "test");
      }

      let worked = false;
      await new CliStartup("test", {
        name: "test",
      })
        .use(async (ctx) => {
          const service = await ctx.getService(CopyIgnoreService);
          Object.defineProperty(service, "targetDir", {
            get: () => dir + "-target",
          });
          Object.defineProperty(service, "sourceDir", {
            get: () => dir,
          });

          await service.create();
          fs.existsSync(dir + "-target/.gitignore").should.eq(targetExist);

          worked = true;
        })
        .run();
      worked.should.true;
    });
  }

  it("should copy file .gitignore", async () => {
    await runTest("copy-ignore", ".gitignore", true);
  });

  it("should copy file .npmignore when .gitignore is not exist", async () => {
    await runTest("copy-ignore-npmignore", ".npmignore", true);
  });

  it("should not copy file when .npmignore and .gitignore are not exist", async () => {
    await runTest("copy-ignore-not", undefined, false);
  });
});
