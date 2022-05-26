import { parseInject } from "@sfajs/inject";
import { runin } from "@sfajs/testing";
import path from "path";
import { CliStartup } from "../../../src/cli-startup";
import { CreateTemplateService } from "../../../src/services/create-template.service";
import { Plugin } from "../../../src/services/plugin-select.service";
import * as fs from "fs";

export async function testTemplate(
  fn: (service: CreateTemplateService) => void | Promise<void>
) {
  let worked = false;
  await runin("test/services/create", async () => {
    await new CliStartup()
      .use(async (ctx) => {
        const service = await parseInject(ctx, CreateTemplateService);
        if (!fs.existsSync("./dist")) {
          fs.mkdirSync("./dist");
        }

        await fn(service);
        worked = true;
      })
      .run();
  });
  expect(worked).toBeTruthy();
}

export async function testTemplateDefault(
  plugins: Plugin[],
  file: string,
  fn: (text?: string) => void | Promise<void>,
  beforeFn?: () => void | Promise<void>
) {
  await testTemplate(async (service) => {
    fs.rmSync("./dist/template", {
      recursive: true,
      force: true,
    });

    if (beforeFn) {
      await beforeFn();
    }

    service.create(
      plugins,
      path.join(__dirname, "dist/template"),
      path.join(__dirname, "template")
    );
    expect(fs.existsSync("dist")).toBeTruthy();

    if (fs.existsSync(`dist/template/${file}`)) {
      const text = fs.readFileSync(`dist/template/${file}`, "utf-8");
      await fn(text);
    } else {
      await fn(undefined);
    }
  });
}
