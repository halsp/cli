import { FileService } from "../../src/services/file.service";
import { runTest } from "./runTest";
import * as fs from "fs";
import inquirer from "inquirer";

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
