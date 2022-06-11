import { CliStartup } from "../../src/cli-startup";
import { runin } from "@sfajs/testing";
import { isUndefined } from "@sfajs/core";

function testCliStartup(args?: any, options?: any) {
  test(`cli startup`, async () => {
    let worked = false;
    await runin("test/cli-startup", async () => {
      const res = await new CliStartup(args, options)
        .use((ctx) => {
          ctx.ok({
            options: ctx.commandOptions,
            args: ctx.commandArgs,
            a: ctx.commandOptions["a"],
          });
        })
        .run();

      expect(res.body).toEqual({
        options: isUndefined(options) ? {} : { a: 1 },
        args: {},
        a: isUndefined(options) ? undefined : 1,
      });
      worked = true;
    });
    expect(worked).toBeTruthy();
  });
}
testCliStartup({}, { a: 1 });
testCliStartup(undefined, undefined);

test(`cli-startup throw error`, async () => {
  await runin("test/cli-startup", async () => {
    const errMsg = "startup-err";
    let err = false;
    try {
      await new CliStartup()
        .use(() => {
          throw new Error(errMsg);
        })
        .run();
    } catch (error) {
      expect((error as Error).message).toBe(errMsg);
      err = true;
    }
    expect(err).toBeTruthy();
  });
});
