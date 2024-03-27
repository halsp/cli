import { CopyTsconfigService } from "../../src/services/scaffold.services/copy-tsconfig.service";
import { CopyPackageService } from "../../src/services/scaffold.services/copy-package.service";
import { testService } from "../utils";
import * as fs from "fs";
import path from "path";
import { expect } from "chai";

describe("copy-tsconfig-json", () => {
  async function testCommonjs(commonjs: boolean) {
    const testName = `test/create/.cache-create-tsconfig-${commonjs ? "commonjs" : "module"}`;
    if (!fs.existsSync(testName)) {
      fs.mkdirSync(testName);
    }

    await testService(
      CopyTsconfigService,
      async (ctx, service) => {
        await service.create();

        const text = await fs.promises.readFile(
          path.join(testName, "tsconfig.json"),
          "utf-8",
        );
        const json = JSON.parse(text);
        expect(json.compilerOptions.module).eq(
          commonjs ? "CommonJS" : "ES2022",
        );
        expect(json.compilerOptions.moduleResolution).eq(
          commonjs ? "Node" : "Bundler",
        );
      },
      {
        args: {
          name: testName,
        },
        options: {
          commonjs,
        },
      },
    );
  }

  it("should copy cjs when commonjs is true", async () => {
    await testCommonjs(true);
  });

  it("should copy mjs when commonjs is false", async () => {
    await testCommonjs(false);
  });
});

describe("copy-package-json", () => {
  async function testCommonjs(commonjs: boolean) {
    const testName = `test/create/.cache-create-package-json-${commonjs ? "commonjs" : "module"}`;
    if (!fs.existsSync(testName)) {
      fs.mkdirSync(testName);
    }

    await testService(
      CopyPackageService,
      async (ctx, service) => {
        await service.create([]);

        const text = await fs.promises.readFile(
          path.join(testName, "package.json"),
          "utf-8",
        );
        const json = JSON.parse(text);
        expect(json.type).eq(commonjs ? "commonjs" : "module");
      },
      {
        args: {
          name: testName,
        },
        options: {
          commonjs,
        },
      },
    );
  }

  it("should set type=commonjs when commonjs is true", async () => {
    await testCommonjs(true);
  });

  it("should set type=module when commonjs is false", async () => {
    await testCommonjs(false);
  });
});
