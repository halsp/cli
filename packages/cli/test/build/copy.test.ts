import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import { CopyBuildResultMiddleware } from "../../src/middlewares/copy-build-result.middleware";
import * as fs from "fs";

describe("copy package", () => {
  it("should copy package", async () => {
    let callCount = 0;
    await runin(`test/build/script`, async () => {
      await new CliStartup("test", undefined, {
        copyPackage: true,
        mode: "production",
      })
        .add(BuildMiddlware)
        .run();

      expect(fs.existsSync("./.ipare-cache/package.json")).toBeTruthy();
      callCount++;
    });
    expect(callCount).toBe(1);
  }, 10000);

  it("should copy package without devDependencies", async () => {
    let callCount = 0;
    await runin(`test/build/script`, async () => {
      await new CliStartup("test", undefined, {
        copyPackage: true,
        removeDevDeps: true,
        mode: "production",
      })
        .add(BuildMiddlware)
        .run();

      expect(fs.existsSync("./.ipare-cache/package.json")).toBeTruthy();
      expect(
        JSON.parse(fs.readFileSync("./.ipare-cache/package.json", "utf-8"))
          .devDependencies
      ).toEqual({});
      callCount++;
    });
    expect(callCount).toBe(1);
  }, 10000);
});

describe("copy build files", () => {
  it(`should copy build files when use CopyBuildResultMiddleware`, async () => {
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
});
