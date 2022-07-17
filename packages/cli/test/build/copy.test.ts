import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import { CopyBuildResultMiddleware } from "../../src/middlewares/copy-build-result.middleware";
import * as fs from "fs";

test(`copy cache`, async () => {
  let callCount = 0;
  await runin(`test/build/copy`, async () => {
    await new CliStartup()
      .add(BuildMiddlware)
      .add(CopyBuildResultMiddleware)
      .run();

    expect(fs.existsSync("./dist")).toBeTruthy();
    expect(fs.existsSync("./dist/build-test.js")).toBeTruthy();
    callCount++;
  });
  expect(callCount).toBe(1);
}, 10000);
