import { Context, ObjectConstructor } from "@halsp/core";
import { CliStartup } from "../src/cli-startup";
import { expect } from "chai";

export async function runin(path: string, fn: () => void | Promise<void>) {
  const cwd = process.cwd();
  process.chdir(path);
  try {
    await fn();
  } finally {
    process.chdir(cwd);
  }
}

export async function testService<T extends object = any>(
  service: ObjectConstructor<T>,
  expectFn: (ctx: Context, service: T) => Promise<void>,
  args: {
    mode?: string;
    args?: any;
    options?: any;
    cwd?: string;
  } = {},
) {
  let worked = false;
  await runin(args.cwd ?? process.cwd(), async () => {
    await new CliStartup(args.mode, args.args, args.options)
      .use(async (ctx) => {
        const svc = await ctx.getService(service);
        expect(svc).not.undefined;
        await expectFn(ctx, svc);
        worked = true;
      })
      .run();
  });
  expect(worked).true;
}
