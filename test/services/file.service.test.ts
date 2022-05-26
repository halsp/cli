import { FileService } from "../../src/services/file.service";
import { runTest } from "./runTest";
import * as fs from "fs";

runTest(FileService, async (ctx, service) => {
  fs.rmSync("dist", {
    recursive: true,
    force: true,
  });

  service.copy("dist", "dist1");
  expect(fs.existsSync("dist1")).toBeFalsy();

  fs.mkdirSync("dist");

  fs.writeFileSync("dist/f1.js", "f1");
  fs.writeFileSync("dist/f2.ts", "f2");
  service.globDelete("dist", "**/*.ts");

  expect(fs.existsSync("dist/f1.js")).toBeTruthy();
  expect(fs.existsSync("dist/f2.ts")).toBeFalsy();
});
