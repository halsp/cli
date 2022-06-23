import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import * as fs from "fs";

test(`build error`, async () => {
  let callCount = 0;
  await runin(`test/build/build-error`, async () => {
    await new CliStartup().add(BuildMiddlware).run();

    expect(fs.existsSync("./.sfa-cache")).toBeFalsy();
    callCount++;
  });
  expect(callCount).toBe(1);
});
