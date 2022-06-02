import { CompilerService } from "../../src/services/compiler.service";
import { runTest } from "./runTest";
import * as fs from "fs";

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
