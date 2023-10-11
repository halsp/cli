import { CliStartup } from "../../src/cli-startup";
import { InfoMiddleware } from "../../src/middlewares/info.middleware";
import { runin } from "../utils";

describe("info", () => {
  it(`should log info with assets options`, async () => {
    await new CliStartup("test", undefined, {
      assets: "assets",
    })
      .add(InfoMiddleware)
      .run();
  });

  it(`should log info with empty package`, async () => {
    let worked = false;
    await runin("test/info/empty-package", async () => {
      await new CliStartup("test", undefined, {
        assets: "assets",
      })
        .add(InfoMiddleware)
        .run();
      worked = true;
    });
    worked.should.true;
  });
});
