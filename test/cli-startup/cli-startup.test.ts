import { CliStartup } from "../../src/cli-startup";
import { createTsconfig, runin } from "../utils";
import { isUndefined } from "@halsp/core";

describe("startup", () => {
  async function testCliStartup(args?: any, options?: any) {
    let worked = false;
    await runin("test/cli-startup", async () => {
      createTsconfig();
      const res = await new CliStartup("test", args, options)
        .use((ctx) => {
          ctx.res.setBody({
            options: ctx.commandOptions,
            args: ctx.commandArgs,
            a: ctx.commandOptions["a"],
          });
        })
        .run();

      res.body!.should.deep.eq({
        options: isUndefined(options) ? {} : { a: 1 },
        args: {},
        a: isUndefined(options) ? undefined : 1,
      });
      worked = true;
    });
    worked.should.true;
  }
  it("should invoke with options and args", async () => {
    await testCliStartup({}, { a: 1 });
  });

  it("should invoke without options and args", async () => {
    await testCliStartup(undefined, undefined);
  });
});

describe("error", () => {
  it(`should throw error when throw error in middleware`, async () => {
    await runin("test/cli-startup", async () => {
      createTsconfig();
      const errMsg = "startup-err";
      let err = false;
      try {
        await new CliStartup()
          .use(() => {
            throw new Error(errMsg);
          })
          .run();
      } catch (error) {
        (error as Error).message.should.eq(errMsg);
        err = true;
      }
      err.should.true;
    });
  });
});
