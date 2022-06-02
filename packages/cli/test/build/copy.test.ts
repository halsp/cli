import { runin } from "@sfajs/testing";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import { CopyResultMiddleware } from "../../src/middlewares/copy-result.middleware";
import * as fs from "fs";

test(`build script`, async () => {
  let callCount = 0;
  await runin(`test/build/copy`, async () => {
    await new CliStartup().add(BuildMiddlware).add(CopyResultMiddleware).run();

    expect(fs.existsSync("./dist")).toBeTruthy();
    expect(fs.existsSync("./dist/build-test.js")).toBeTruthy();
    callCount++;
  });
  expect(callCount).toBe(1);
});
