import { ConfigService } from "../../../../src/services/config.service";
import { runin } from "@sfajs/testing";
import { CliStartup } from "../../../../src/cli-startup";
import { parseInject } from "@sfajs/inject";

test(`config file not exist`, async () => {
  let worked = false;
  await runin("test/services/config/not-exist", async () => {
    await new CliStartup()
      .use(async (ctx) => {
        const service = await parseInject(ctx, ConfigService);
        expect(service.mode).toBe("production");
        expect(service.configFileName).toBe("");
        expect(service.configFilePath).toBe("");
        expect(service.value).toEqual({});
        worked = true;
      })
      .run();
  });
  expect(worked).toBeTruthy();
});
