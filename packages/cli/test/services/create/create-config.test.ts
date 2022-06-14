import { parseInject } from "@sfajs/inject";
import { runin } from "../../utils";
import path from "path";
import { CliStartup } from "../../../src/cli-startup";
import { CreateConfigService } from "../../../src/services/create-config.service";
import * as fs from "fs";

test(`create config`, async () => {
  let worked = false;
  await runin("test/services/create", async () => {
    await new CliStartup({ name: "test" })
      .use(async (ctx) => {
        const service = await parseInject(ctx, CreateConfigService);

        expect((service as any).targetDir).not.toBeUndefined();
        expect((service as any).sourceFile).not.toBeUndefined();

        ctx.bag("PACKAGE_MANAGER", "pnpm");
        Object.defineProperty(service, "targetDir", {
          get: () => path.join(__dirname, "dist/config"),
        });
        Object.defineProperty(service, "sourceFile", {
          get: () => path.join(__dirname, "config/sfa-cli.config.ts"),
        });

        await service.create(["cli"]);

        expect(fs.existsSync("dist/config/sfa-cli.config.ts")).toBeTruthy();
        expect(
          fs
            .readFileSync("dist/config/sfa-cli.config.ts", "utf-8")
            .includes('packageManager: "pnpm"')
        ).toBeTruthy();

        worked = true;
      })
      .run();
  });
  expect(worked).toBeTruthy();
});
