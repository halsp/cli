import { runin } from "@sfajs/testing";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import * as fs from "fs";

test(`build assets`, async () => {
  let worked = false;
  await runin(`test/build/assets`, async () => {
    await new CliStartup().add(BuildMiddlware).run();

    expect(fs.existsSync("./dist")).toBeTruthy();
    expect(fs.existsSync("./dist/assets")).toBeTruthy();
    expect(fs.existsSync("./dist/assets/test.txt")).toBeTruthy();
    expect(fs.readFileSync("./dist/assets/test.txt", "utf-8")).toBe(
      "test-build"
    );
    expect(fs.existsSync("./dist/build-test.js")).toBeTruthy();
    worked = true;
  });
  expect(worked).toBeTruthy();
});
