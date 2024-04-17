import path from "path";
import fs from "fs";
import { CliStartup } from "../../src/cli-startup";
import { createTsconfig, runin, testService } from "../utils";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import { CompilerService } from "../../src/services/build.services/compiler.service";
import { expect } from "chai";

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

describe("shims dirname", () => {
  it("should add __dirname for esm", async () => {
    const dirName = ".cache-dirname-esm";
    const configFileName = "tsconfig.dirname.esm.json";
    createTsconfig(
      path.join(__dirname, "compiler/add-shims"),
      undefined,
      configFileName,
    );

    await runin("test/build/compiler/add-shims", async () => {
      await new CliStartup("test", undefined, {
        cacheDir: dirName,
        tsconfigPath: configFileName,
      })
        .add(BuildMiddlware)
        .run();

      const code = await fs.promises.readFile(path.join(dirName, "dirname.js"));
      code.includes("const __dirname").should.true;
    });
  });

  it("should not add __dirname for cjs", async () => {
    const dirName = ".cache-dirname-cjs";
    const configFileName = "tsconfig.dirname.cjs.json";
    createTsconfig(
      path.join(__dirname, "compiler/add-shims"),
      (c) => {
        c.compilerOptions = {
          target: "ES2022",
          module: "CommonJS",
          moduleResolution: "Node",
          outDir: "./dist",
        };
      },
      configFileName,
    );

    await runin("test/build/compiler/add-shims", async () => {
      await new CliStartup("test", undefined, {
        cacheDir: dirName,
        tsconfigPath: configFileName,
        moduleType: "cjs",
      })
        .add(BuildMiddlware)
        .run();

      const code = await fs.promises.readFile(
        path.join(dirName, "dirname.cjs"),
      );
      code.includes("const __dirname").should.false;
    });
  });
});

describe("shims _require", () => {
  it("should add _require for esm", async () => {
    const dirName = ".cache-require-esm";
    const configFileName = "tsconfig.require.esm.json";
    createTsconfig(
      path.join(__dirname, "compiler/add-shims"),
      undefined,
      configFileName,
    );

    await runin("test/build/compiler/add-shims", async () => {
      await new CliStartup("test", undefined, {
        cacheDir: dirName,
        tsconfigPath: configFileName,
      })
        .add(BuildMiddlware)
        .run();

      const code = await fs.promises.readFile(path.join(dirName, "require.js"));
      code.includes("_halsp_cli_shims_module.createRequire").should.true;
    });
  });

  it("should add _require for cjs", async () => {
    const dirName = ".cache-require-cjs";
    const configFileName = "tsconfig.require.cjs.json";
    createTsconfig(
      path.join(__dirname, "compiler/add-shims"),
      (c) => {
        c.compilerOptions = {
          target: "ES2022",
          module: "CommonJS",
          moduleResolution: "Node",
          outDir: "./dist",
        };
      },
      configFileName,
    );

    await runin("test/build/compiler/add-shims", async () => {
      await new CliStartup("test", undefined, {
        cacheDir: dirName,
        tsconfigPath: configFileName,
        moduleType: "cjs",
      })
        .add(BuildMiddlware)
        .run();

      const code = await fs.promises.readFile(
        path.join(dirName, "require.cjs"),
      );
      code.includes("const _require = require").should.true;
    });
  });
});

describe("shims _resolve", () => {
  it("should add _resolve for esm", async () => {
    const dirName = ".cache-resolve-esm";
    const configFileName = "tsconfig.resolve.esm.json";
    createTsconfig(
      path.join(__dirname, "compiler/add-shims"),
      undefined,
      configFileName,
    );

    await runin("test/build/compiler/add-shims", async () => {
      await new CliStartup("test", undefined, {
        cacheDir: dirName,
        tsconfigPath: configFileName,
      })
        .add(BuildMiddlware)
        .run();

      const code = await fs.promises.readFile(path.join(dirName, "resolve.js"));
      code.includes("const _resolve = import.meta.resolve;").should.true;
    });
  });

  it("should add _resolve for cjs", async () => {
    const dirName = ".cache-resolve-cjs";
    const configFileName = "tsconfig.resolve.cjs.json";
    createTsconfig(
      path.join(__dirname, "compiler/add-shims"),
      (c) => {
        c.compilerOptions = {
          target: "ES2022",
          module: "CommonJS",
          moduleResolution: "Node",
          outDir: "./dist",
        };
      },
      configFileName,
    );

    await runin("test/build/compiler/add-shims", async () => {
      await new CliStartup("test", undefined, {
        cacheDir: dirName,
        tsconfigPath: configFileName,
        moduleType: "cjs",
      })
        .add(BuildMiddlware)
        .run();

      const code = await fs.promises.readFile(
        path.join(dirName, "resolve.cjs"),
      );
      code.includes("const _resolve = (name, dir) => require.resolve(name, { paths: [dir] });").should.true;
    });
  });
});

describe("moduleType", () => {
  it("should be error when moduleType is invalid", async () => {
    const dirName = ".cache-moduleType-invalid";
    const configFileName = "tsconfig.moduleType.invalid.json";
    createTsconfig(
      path.join(__dirname, "compiler/add-ext"),
      undefined,
      configFileName,
    );

    let callCount = 0;
    await runin("test/build/compiler/add-ext", async () => {
      try {
        await new CliStartup("test", undefined, {
          cacheDir: dirName,
          tsconfigPath: configFileName,
          moduleType: "not-exist",
        })
          .add(BuildMiddlware)
          .run();
      } catch (err) {
        const error = err as Error;
        error.message.should.eq("The moduleType is invalid.");
        callCount++;
      }
    });
    callCount.should.eq(1);
  });

  it("should set moduleType=mjs when command is start and package.type is module", async () => {
    await testService(
      CompilerService,
      async (ctx, service) => {
        expect(service["moduleType"]).eq("mjs");
      },
      {
        mode: "start",
        cwd: "test/build/config/esm/mjs",
        options: {},
      },
    );
  });

  it("should set moduleType=cjs when command is start and package.type is commonjs", async () => {
    await testService(
      CompilerService,
      async (ctx, service) => {
        expect(service["moduleType"]).eq("cjs");
      },
      {
        mode: "start",
        cwd: "test/build/config/esm/cjs",
        options: {},
      },
    );
  });

  it("should set moduleType=cjs when command is start and package.type is empty", async () => {
    await testService(
      CompilerService,
      async (ctx, service) => {
        expect(service["moduleType"]).eq("cjs");
      },
      {
        mode: "start",
        cwd: "test/build/config/esm/empty",
        options: {},
      },
    );
  });
});
