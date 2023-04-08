import { FileService } from "../../src/services/file.service";
import { runTest } from "./runTest";
import inquirer from "inquirer";

function testOverwrite(value: boolean) {
  runTest(FileService, async (ctx, service) => {
    const prompt = inquirer.prompt;
    inquirer.prompt = (() => Promise.resolve({ overwrite: value })) as any;
    try {
      const result = await service.isOverwrite("abc");
      result.should.eq(value);
    } finally {
      inquirer.prompt = prompt;
    }
  });
}
testOverwrite(true);
testOverwrite(false);
