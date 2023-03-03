import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import * as fs from "fs";

describe("error", () => {
  it(`should build error when code is wrong`, async () => {
    let callCount = 0;
    await runin(`test/build/build-error`, async () => {
      await new CliStartup().add(BuildMiddlware).run();

      expect(fs.existsSync("./.halsp-cache")).toBeFalsy();
      callCount++;
    });
    expect(callCount).toBe(1);
  });
});
