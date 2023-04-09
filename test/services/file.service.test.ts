import { FileService } from "../../src/services/file.service";
import { runTest } from "./runTest";
import { InquirerService } from "../../src/services/inquirer.service";
import { parseInject } from "@halsp/inject";

function testOverwrite(value: boolean) {
  runTest(FileService, async (ctx, service) => {
    const inquirerService = await parseInject(ctx, InquirerService);
    Object.defineProperty(inquirerService, "prompt", {
      value: () => Promise.resolve({ overwrite: value }),
    });

    const result = await service.isOverwrite("abc");
    result.should.eq(value);
  });
}
testOverwrite(true);
testOverwrite(false);
