import { CliStartup } from "../../src/cli-startup";
import { runin } from "../utils";
import { isUndefined } from "@halsp/common";

describe("startup", () => {
  async function testCliStartup(args?: any, options?: any) {
    let worked = false;
    await runin("test/cli-startup", async () => {
      const res = await new CliStartup("test", args, options)
        .use((ctx) => {
          ctx.res.setBody({
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
});
