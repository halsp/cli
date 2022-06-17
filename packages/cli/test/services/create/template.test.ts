import { parseInject } from "@sfajs/inject";
import { runin } from "../../utils";
import path from "path";
import { CliStartup } from "../../../src/cli-startup";
import { CreateTemplateService } from "../../../src/services/create-template.service";
import * as fs from "fs";
import { Plugin } from "../../../src/utils/plugins";

async function testTemplate(
  fn: (service: CreateTemplateService) => void | Promise<void>
) {
  let worked = false;
  await runin("test/services/create", async () => {
    await new CliStartup({ name: "test" })
      .use(async (ctx) => {
        const service = await parseInject(ctx, CreateTemplateService);
        if (!fs.existsSync("./.sfa-cache")) {
          fs.mkdirSync("./.sfa-cache");
        }

        await fn(service);
        worked = true;
      })
      .run();
  });
  expect(worked).toBeTruthy();
}

async function testTemplateDefault(
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

    expect((service["targetDir"] as string).endsWith("test")).toBeTruthy();
    Object.defineProperty(service, "targetDir", {
      get: () => path.join(__dirname, "dist/template"),
    });
    Object.defineProperty(service, "sourceDir", {
      get: () => path.join(__dirname, "template"),
    });
    await service.create(plugins);
    expect(fs.existsSync("dist")).toBeTruthy();

    if (fs.existsSync(`dist/template/${file}`)) {
      const text = fs.readFileSync(`dist/template/${file}`, "utf-8");
      await fn(text);
    } else {
      await fn(undefined);
    }
  });
}

async function testContains(contains: boolean) {
  test(`template contains ${contains}`, async () => {
    await testTemplateDefault(
      contains ? ["router", "mva"] : ["router"],
      "contains.ts",
      (text) => {
        if (contains) {
          expect(text?.trim()?.split("\n")?.at(0)?.trim()).toBe(
            "// ROUTER_CONTENT"
          );
        } else {
          expect(text?.trim()?.split("\n")?.at(0)?.trim()).toBe(
            "// CONTAINS_CONTENT"
          );
        }
      }
    );
  });
}
testContains(true);
testContains(false);

async function testSelect(select: boolean) {
  test(`template select ${select}`, async () => {
    await testTemplateDefault(
      [select ? "inject" : "router"],
      "select.ts",
      (text) => {
        if (select) {
          expect(text?.trim()).toBe("// INJECT_CONTENT");
        } else {
          expect(text).toBeUndefined();
        }
      }
    );
  });
}
testSelect(true);
testSelect(false);

test(`crlf`, async () => {
  await testTemplateDefault(
    [],
    "crlf.txt",
    (text) => {
      expect(text).toBe("a\r\nb");
    },
    () => {
      fs.writeFileSync("./template/crlf.txt", "a\r\nb");
    }
  );
});

test(`default template`, async () => {
  await testTemplate(async (service) => {
    fs.rmSync("./dist/default", {
      recursive: true,
      force: true,
    });

    Object.defineProperty(service, "targetDir", {
      get: () => path.join(__dirname, "dist/default"),
    });
    await service.create([]);
    expect(fs.existsSync("dist/default")).toBeTruthy();
    expect(fs.existsSync("dist/default/.eslintrc.js")).toBeTruthy();
    expect(fs.existsSync("dist/default/jest.config.js")).toBeTruthy();
  });
});

function testChildren(childrenEnable: boolean) {
  test(`children ${childrenEnable}`, async () => {
    await testTemplateDefault(
      childrenEnable ? ["router", "filter"] : ["router"],
      "children.ts",
      (text) => {
        if (childrenEnable) {
          expect(text?.trim()).toBe("// ROUTER_CONTENT\n// FILTER_CONTENT");
        } else {
          expect(text?.trim()).toBe("// ROUTER_CONTENT");
        }
      }
    );
  });
}
testChildren(true);
testChildren(false);

test(`sourceDir not exist`, async () => {
  await testTemplate((service) => {
    fs.rmSync("./dist/not-exist", {
      recursive: true,
      force: true,
    });

    Object.defineProperty(service, "targetDir", {
      get: () => path.join(__dirname, "dist/not-exist"),
    });
    Object.defineProperty(service, "sourceDir", {
      get: () => path.join(__dirname, "not-exist"),
    });
    expect(fs.existsSync("dist/not-exist")).toBeFalsy();
  });
});

test(`error sourceDir`, async () => {
  await testTemplate(async (service) => {
    Object.defineProperty(service, "sourceDir", {
      get: () => path.join(__dirname, "dist/not-exist"),
    });

    await service.create([]);
    expect(fs.existsSync("dist/not-exist")).toBeFalsy();
  });
});
