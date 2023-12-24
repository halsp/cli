import { Context, ObjectConstructor } from "@halsp/core";
import { CliStartup } from "../src/cli-startup";
import { expect } from "chai";
import "../src/compiler";
import fs from "fs";
import path from "path";

export async function runin(path: string, fn: () => void | Promise<void>) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, {
      recursive: true,
    });
  }

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

export function createTsconfig(
  dir = process.cwd(),
  config?: (config: any) => any,
  fileName = "tsconfig.json",
): Record<string, any> {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    });
  }
  const targetDir = path.relative(dir, path.join(__dirname, ".."));
  const configFilePath = path.join(targetDir, "tsconfig.base.json");
  const defConfig = {
    extends: configFilePath.replace(/\\/g, "/"),
    compilerOptions: {
      outDir: "dist",
    },
    include: ["src/**/*"],
    exclude: ["*.test.ts"],
  };
  const newConfig = config?.call(null, defConfig) ?? defConfig;

  const json = JSON.stringify(newConfig);
  const filePath = path.resolve(dir, fileName);
  fs.writeFileSync(filePath, json);
  return newConfig;
}
