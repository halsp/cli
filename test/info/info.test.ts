import { CliStartup } from "../../src/cli-startup";
import { InfoMiddleware } from "../../src/middlewares/info.middleware";
import { runin } from "../utils";

test(`info`, async () => {
  await new CliStartup("test", undefined, {
    assets: "assets",
  })
    .add(InfoMiddleware)
    .run();
});

test(`empty package`, async () => {
  let worked = false;
  await runin("test/info/empty-package", async () => {
    await new CliStartup("test", undefined, {
      assets: "assets",
    })
      .add(InfoMiddleware)
      .run();
    worked = true;
  });
  expect(worked).toBeTruthy();
});
