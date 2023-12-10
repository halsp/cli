import { FileService } from "../../src/services/file.service";
import { runTest } from "./runTest";

function testOverwrite(value: boolean) {
  runTest(FileService, async (ctx, service) => {
    const inquirer = await import("inquirer");
    Object.defineProperty(inquirer, "prompt", {
      value: () => Promise.resolve({ overwrite: value }),
    });

    const result = await service.isOverwrite("abc");
    result.should.eq(value);
  });
}
testOverwrite(true);
testOverwrite(false);
