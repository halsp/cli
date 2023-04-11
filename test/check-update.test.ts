import { parseInject } from "@halsp/inject";
import { CliStartup } from "../src/cli-startup";
import { CommandService } from "../src/services/command.service";

describe("check update", () => {
  it("should skip check update when --skipCheckUpdate is true", async () => {
    await new CliStartup("test", undefined, {
      skipCheckUpdate: true,
    })
      .use(async (ctx) => {
        const service = await parseInject(ctx, CommandService);
        service.getOptionVlaue("skipCheckUpdate", false).should.true;
      })
      .run();
  });
});
