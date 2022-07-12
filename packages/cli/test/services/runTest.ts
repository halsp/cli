import { HttpContext, ObjectConstructor } from "@ipare/core";
import { CliStartup } from "../../src/cli-startup";
import { runin } from "../utils";
import { parseInject } from "@ipare/inject";

export function runTest<T extends object = any>(
  service: ObjectConstructor<T>,
  expectFn: (ctx: HttpContext, service: T) => Promise<void>,
  args?: any,
  options?: any
) {
  test(`service ${service.name} ${!!args} ${!!options}`, async () => {
    let worked = false;
    await runin("test/services", async () => {
      await new CliStartup(args, options)
        .use(async (ctx) => {
          const svc = await parseInject(ctx, service);
          expect(svc).not.toBeUndefined();
          await expectFn(ctx, svc);
          worked = true;
        })
        .run();
    });
    expect(worked).toBeTruthy();
  });
}
