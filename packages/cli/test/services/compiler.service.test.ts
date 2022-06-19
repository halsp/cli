import { CompilerService } from "../../src/services/compiler.service";
import { runTest } from "./runTest";
import * as fs from "fs";
import { WatchCompilerService } from "../../src/services/watch-compiler.service";

runTest(CompilerService, async (ctx, service) => {
  fs.rmSync("./dist-compiler", {
    recursive: true,
    force: true,
  });
  try {
    const compilerResult = service.compiler("dist-compiler");
    expect(compilerResult).toBe(true);
    expect(fs.existsSync("./dist-compiler")).toBe(true);
  } finally {
    fs.rmSync("./dist-compiler", {
      recursive: true,
      force: true,
    });
  }
});

runTest(WatchCompilerService, async (ctx, service) => {
  const fn = () => ({
    a: 1,
  });
  const newFn = (service as any).createDiagnosticReporter.bind(service)(fn);
  expect(newFn()).toEqual({ a: 1 });
});
