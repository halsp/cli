import { ConfigService } from "../../../../src/services/build.services/config.service";
import { runin } from "../../../utils";
import { CliStartup } from "../../../../src/cli-startup";
import { parseInject } from "@ipare/inject";

test(`config file not exist`, async () => {
  let worked = false;
  await runin("test/services/config/not-exist", async () => {
    await new CliStartup()
      .use(async (ctx) => {
        const service = await parseInject(ctx, ConfigService);
        expect(service.mode).toBe("production");
        expect(service.value).toEqual({});
        worked = true;
      })
      .run();
  });
  expect(worked).toBeTruthy();
});
