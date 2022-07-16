import { FileService } from "../../src/services/file.service";
import { runTest } from "./runTest";
import * as fs from "fs";
import inquirer from "inquirer";
import path from "path";

runTest(FileService, async (ctx, service) => {
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist");
  }
  const dir = path.join("dist", "file");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  fs.writeFileSync(dir + "/f1.js", "f1");
  fs.writeFileSync(dir + "/f2.ts", "f2");
  service.globDelete(dir, "**/*.ts");
  service.globDelete(dir + "not-exist", "**/*.ts");

  expect(fs.existsSync(dir + "/f1.js")).toBeTruthy();
  expect(fs.existsSync(dir + "/f2.ts")).toBeFalsy();
});

function testOverwrite(value: boolean) {
  runTest(FileService, async (ctx, service) => {
    const prompt = inquirer.prompt;
    inquirer.prompt = (() => Promise.resolve({ overwrite: value })) as any;
    try {
      const result = await service.isOverwrite("abc");
      expect(result).toBe(value);
    } finally {
      inquirer.prompt = prompt;
    }
  });
}
testOverwrite(true);
testOverwrite(false);
