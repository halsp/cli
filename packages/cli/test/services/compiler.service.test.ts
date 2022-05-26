import { CompilerService } from "../../src/services/compiler.service";
import { runTest } from "./runTest";
import * as fs from "fs";

runTest(CompilerService, async (ctx, service) => {
  const compilerResult = service.compiler();
  expect(compilerResult).toBe(true);
  expect(fs.existsSync("./dist")).toBe(true);
  fs.rmSync("./dist", {
    recursive: true,
    force: true,
  });
});
