import { CompilerService } from "../../src/services/compiler.service";
import { runTest } from "./runTest";
import * as fs from "fs";
import { WatchCompilerService } from "../../src/services/watch-compiler.service";
import { COMMAND_TYPE_METADATA } from "../../src/constant";

runTest(CompilerService, async (ctx, service) => {
  fs.rmSync("./dist-compiler", {
    recursive: true,
    force: true,
  });

  let done = true;
  try {
    const compilerResult = service.compile("dist-compiler");
    expect(compilerResult).toBe(true);
    expect(fs.existsSync("./dist-compiler")).toBe(true);
    done = true;
  } finally {
    fs.rmSync("./dist-compiler", {
      recursive: true,
      force: true,
    });
  }
  expect(done).toBeTruthy();
});

runTest(WatchCompilerService, async (ctx, service) => {
  const fn = () => ({
    a: 1,
  });
  const newFn = (service as any).createDiagnosticReporter.bind(service)(fn);
  expect(newFn()).toEqual({ a: 1 });
});

function runCompilerOptions(command: "start" | "build") {
  runTest(
    CompilerService,
    async (ctx, service) => {
      ctx[COMMAND_TYPE_METADATA] = command;
      expect((service as any).getCompilerOptions({}, "")).toEqual({
        outDir: "",
        sourceMap: command == "start",
      });
    },
    undefined,
    {
      sourceMap: false,
    }
  );
}
runCompilerOptions("start");
runCompilerOptions("build");
