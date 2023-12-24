import { CompilerService } from "../../src/services/build.services/compiler.service";
import { runTest } from "./runTest";
import * as fs from "fs";
import { WatchCompilerService } from "../../src/services/build.services/watch-compiler.service";
import path from "path";
import ts from "typescript";
import { createTsconfig } from "../utils";

runTest(
  CompilerService,
  async (ctx, service) => {
    await fs.promises.rm("./cache-compiler", {
      recursive: true,
      force: true,
    });

    const compilerResult = await service.compile(".cache-compiler");
    compilerResult.should.eq(true);
    fs.existsSync(".cache-compiler").should.eq(true);
  },
  undefined,
  undefined,
  {
    tsconfigPath: "tsconfig.compiler.json",
  },
  () => {
    createTsconfig(
      undefined,
      (c) => {
        c.include = "**/*.ts";
        c.exclude = ["*.test.ts", "dist", "**/dist"];
        return c;
      },
      "tsconfig.compiler.json",
    );
  },
);

runTest(WatchCompilerService, async (ctx, service) => {
  const fn = () => ({
    a: 1,
  });
  const newFn = (service as any).createDiagnosticReporter.bind(service)(fn);
  newFn().should.deep.eq({ a: 1 });
});

function runCompilerOptions(command: "start" | "build") {
  runTest(
    CompilerService,
    async (ctx, service) => {
      (service as any).getCompilerOptions({}, "").should.deep.eq({
        noEmitOnError: true,
        outDir: "",
        sourceMap: command == "start",
      });
    },
    command,
    undefined,
    {
      sourceMap: false,
    },
  );
}
runCompilerOptions("start");
runCompilerOptions("build");

runTest(WatchCompilerService, async (ctx, service) => {
  const targetDir = path.join(__dirname, "dist", "watch-compiler");
  await service.compile(targetDir);
  const watcher = (service as any)
    .watcher as ts.WatchOfConfigFile<ts.EmitAndSemanticDiagnosticsBuilderProgram>;
  const program = watcher.getProgram();
  program.emit(undefined, undefined, undefined, undefined, {});
  watcher.close();
  await fs.promises.rm(targetDir, {
    force: true,
    recursive: true,
  });
});
