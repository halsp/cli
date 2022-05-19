import { CompilerService } from "../../src/services/compiler.service";
import { runTest } from "./runTest";
import * as fs from "fs";
import { parseInject } from "@sfajs/inject";
import { FileService } from "../../src/services/file.service";

runTest(CompilerService, async (ctx, service) => {
  const fileService = await parseInject(ctx, FileService);
  const compilerResult = service.compiler();
  expect(compilerResult).toBe(true);
  expect(fs.existsSync("./dist")).toBe(true);
  fileService.deleteFile("./dist");
});
