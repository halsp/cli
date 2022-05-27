import { FileService } from "../../src/services/file.service";
import { runTest } from "./runTest";
import * as fs from "fs";

runTest(FileService, async (ctx, service) => {
  fs.rmSync("dist", {
    recursive: true,
    force: true,
  });

  fs.mkdirSync("dist");

  fs.writeFileSync("dist/f1.js", "f1");
  fs.writeFileSync("dist/f2.ts", "f2");
  service.globDelete("dist1", "**/*.ts");
  service.globDelete("dist", "**/*.ts");

  expect(fs.existsSync("dist/f1.js")).toBeTruthy();
  expect(fs.existsSync("dist/f2.ts")).toBeFalsy();
});
