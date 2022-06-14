import { ConfigService } from "../../../../src/services/config.service";
import { runin } from "../../../utils";
import { CliStartup } from "../../../../src/cli-startup";
import { parseInject } from "@sfajs/inject";

test(`empty config`, async () => {
  let worked = false;
  await runin("test/services/config/empty", async () => {
    await new CliStartup()
      .use(async (ctx) => {
        const service = await parseInject(ctx, ConfigService);
        expect(service.value).toEqual({});
        worked = true;
      })
      .run();
  });
  expect(worked).toBeTruthy();
});
