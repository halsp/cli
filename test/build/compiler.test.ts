import path from "path";
import fs from "fs";
import { CliStartup } from "../../src/cli-startup";
import { createTsconfig, runin } from "../utils";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";

describe("add ext", () => {
  it("should add .js ext when type is esm", async () => {
    const dirName = ".cache-esm-default";
    createTsconfig(path.join(__dirname, "compiler/add-ext"));

    await runin("test/build/compiler/add-ext", async () => {
      await new CliStartup("test", undefined, {
        cacheDir: dirName,
      })
        .add(BuildMiddlware)
        .run();

      const code = await fs.promises.readFile(path.join(dirName, "add-ext.js"));
      code.includes('import "./test.js"').should.true;
    });
  });

  it("should add .mjs ext when moduleType = mjs", async () => {
    const dirName = ".cache-esm-moduleType-mjs";
    createTsconfig(path.join(__dirname, "compiler/add-ext"));

    await runin("test/build/compiler/add-ext", async () => {
      await new CliStartup("test", undefined, {
        cacheDir: dirName,
        moduleType: "mjs",
      })
        .add(BuildMiddlware)
        .run();

      const code = await fs.promises.readFile(
        path.join(dirName, "add-ext.mjs"),
      );
      code.includes('import "./test.mjs"').should.true;
    });
  });

  it("should not add .js ext when type is cjs", async () => {
    const dirName = ".cache-cjs-default";
    createTsconfig(path.join(__dirname, "compiler/add-ext"), (c) => {
      c.compilerOptions = {
        target: "ES2022",
        module: "CommonJS",
        moduleResolution: "Node",
        outDir: "./dist",
      };
    });

    await runin("test/build/compiler/add-ext", async () => {
      await new CliStartup("test", undefined, {
        cacheDir: dirName,
      })
        .add(BuildMiddlware)
        .run();

      const code = await fs.promises.readFile(path.join(dirName, "add-ext.js"));
      code.includes('require("./test")').should.true;
    });
  });

  it("should add .cjs ext when moduleType = cjs", async () => {
    const dirName = ".cache-cjs-moduleType-cjs";
    createTsconfig(path.join(__dirname, "compiler/add-ext"), (c) => {
      c.compilerOptions = {
        target: "ES2022",
        module: "CommonJS",
        moduleResolution: "Node",
        outDir: "./dist",
      };
    });

    await runin("test/build/compiler/add-ext", async () => {
      await new CliStartup("test", undefined, {
        cacheDir: dirName,
        moduleType: "cjs",
      })
        .add(BuildMiddlware)
        .run();

      const code = await fs.promises.readFile(
        path.join(dirName, "add-ext.cjs"),
      );
      code.includes('require("./test.cjs")').should.true;
    });
  });
});

describe("typeOnly", () => {
  it("should not add ext when type = esm and import or export is typeOnly", async () => {
    const dirName = ".cache-esm-typeOnly";
    createTsconfig(path.join(__dirname, "compiler/add-ext"));

    await runin("test/build/compiler/add-ext", async () => {
      await new CliStartup("test", undefined, {
        cacheDir: dirName,
        moduleType: "mjs",
      })
        .add(BuildMiddlware)
        .run();

      const code = await fs.promises.readFile(
        path.join(dirName, "type-only.mjs"),
      );
      code.includes("test").should.false;
    });
  });

  it("should not add ext when type = cjs and import or export is typeOnly", async () => {
    const dirName = ".cache-cjs-typeOnly";
    createTsconfig(path.join(__dirname, "compiler/add-ext"));

    await runin("test/build/compiler/add-ext", async () => {
      await new CliStartup("test", undefined, {
        cacheDir: dirName,
        moduleType: "cjs",
      })
        .add(BuildMiddlware)
        .run();

      const code = await fs.promises.readFile(
        path.join(dirName, "type-only.cjs"),
      );
      code.includes("test").should.false;
    });
  });
});
