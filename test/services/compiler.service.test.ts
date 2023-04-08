import { CompilerService } from "../../src/services/build.services/compiler.service";
import { runTest } from "./runTest";
import * as fs from "fs";
import { WatchCompilerService } from "../../src/services/build.services/watch-compiler.service";
import path from "path";
import ts from "typescript";

runTest(CompilerService, async (ctx, service) => {
  fs.rmSync("./dist-compiler", {
    recursive: true,
    force: true,
  });

  let done = true;
  try {
    const compilerResult = service.compile("dist-compiler");
    compilerResult.should.eq(true);
    fs.existsSync("./dist-compiler").should.eq(true);
    done = true;
  } finally {
    fs.rmSync("./dist-compiler", {
      recursive: true,
      force: true,
    });
  }
  done.should.true;
});

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
    }
  );
}
runCompilerOptions("start");
runCompilerOptions("build");

runTest(WatchCompilerService, async (ctx, service) => {
  const targetDir = path.join(__dirname, "dist", "watch-compiler");
  service.compile(targetDir);
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
