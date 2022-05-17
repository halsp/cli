import { CliStartup } from "../../src/cli-startup";
import { runin } from "@sfajs/testing";
import { isUndefined } from "@sfajs/core";

function testCliStartup(args?: any, options?: any) {
  test(`cli startup`, async () => {
    await runin("./test/cli-startup", async () => {
      const res = await new CliStartup(args, options)
        .use((ctx) => {
          ctx.ok({
            options: ctx.commandOptions,
            args: ctx.commandArgs,
            a: ctx.getCommandOption("a"),
          });
        })
        .run();

      expect(res.body).toEqual({
        options: isUndefined(options) ? {} : { a: 1 },
        args: {},
        a: isUndefined(options) ? undefined : 1,
      });
    });
  });
}
testCliStartup({}, { a: 1 });
testCliStartup(undefined, undefined);
