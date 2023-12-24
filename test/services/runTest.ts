import { Context, ObjectConstructor } from "@halsp/core";
import { CliStartup } from "../../src/cli-startup";
import { createTsconfig, runin } from "../utils";
import { expect } from "chai";

export function runTest<T extends object = any>(
  service: ObjectConstructor<T>,
  expectFn: (ctx: Context, service: T) => Promise<void>,
  mode = "test",
  args?: any,
  options?: any,
  before?: () => Promise<void> | void,
) {
  it(`service ${service.name} ${!!args} ${!!options}`, async () => {
    let worked = false;
    await runin("test/services", async () => {
      createTsconfig();
      before && (await before());
      await new CliStartup(mode, args, options)
        .use(async (ctx) => {
          const svc = await ctx.getService(service);
          expect(svc).not.undefined;
          await expectFn(ctx, svc);
          worked = true;
        })
        .run();
    });
    worked.should.true;
  });
}
