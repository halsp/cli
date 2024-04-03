import { createTsconfig, runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { CleanDistMiddleware } from "../../src/middlewares/build/clean-dist.middleware";
import * as fs from "fs";
import path from "path";

describe("clean", () => {
  async function testClean(cleanDist: boolean, command: string, val: boolean) {
    const cacheDir = `.cache-clean-dist-dir-${cleanDist}-${command}-${val}`;
    const configFileName = `tsconfig.${cacheDir}.json`;
    const distDir = cacheDir + "-dist";

    await runin(`test/clean`, async () => {
      createTsconfig(
        undefined,
        (c) => {
          c.compilerOptions.outDir = distDir;
        },
        configFileName,
      );

      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir);
      }
      fs.writeFileSync(path.join(distDir, "test.js"), "test");

      await new CliStartup(command, undefined, {
        cacheDir: path.resolve(cacheDir),
        tsconfigPath: configFileName,
        cleanDist: cleanDist,
      })
        .add(CleanDistMiddleware)
        .run();

      fs.existsSync(distDir).should.be.true;
      fs.existsSync(path.join(distDir, "test.js")).should.eq(val);
    });
  }

  it("should clean dist dir", async () => {
    await testClean(false, "clean", false);
  });

  it("should not clean dist dir when command is not clean and cleanDist is false", async () => {
    await testClean(false, "test", true);
  });

  it("should clean dist dir when command is not clean and cleanDist is false", async () => {
    await testClean(true, "test", false);
  });

  it("should not clean when outDir is not exist", async () => {
    const cacheDir = `.cache-clean-dist-dir-not-exist`;
    const configFileName = `tsconfig.${cacheDir}.json`;
    const distDir = cacheDir + "-dist";

    await runin(`test/clean`, async () => {
      createTsconfig(
        undefined,
        (c) => {
          c.compilerOptions.outDir = distDir;
        },
        configFileName,
      );

      if (fs.existsSync(distDir)) {
        fs.mkdirSync(distDir);
      }

      await new CliStartup("test", undefined, {
        cacheDir: path.resolve(cacheDir),
        tsconfigPath: configFileName,
        cleanDist: true,
      })
        .add(CleanDistMiddleware)
        .run();

      fs.existsSync(distDir).should.be.false;
    });
  });
});
