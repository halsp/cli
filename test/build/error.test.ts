import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import * as fs from "fs";
import path from "path";

describe("error", () => {
  it(`should build error when code is wrong`, async () => {
    const cacheDir = ".cache-build-error";
    let callCount = 0;
    await runin(`test/build/build-error`, async () => {
      await new CliStartup(undefined, undefined, {
        cacheDir: path.resolve(cacheDir),
      })
        .add(BuildMiddlware)
        .run();

      expect(fs.existsSync(`./${cacheDir}`)).toBeFalsy();
      callCount++;
    });
    expect(callCount).toBe(1);
  });
});
