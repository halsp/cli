import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { CreateMiddleware } from "../../src/middlewares/create-middleware";
import * as fs from "fs";
import path from "path";
import { PluginConfig } from "../../src/services/create.services/plugin-config.service";

describe("template", () => {
  const testName = ".ipare-cache-template-create";

  function testTemplate(plugins: string[]) {
    const pluginsStr = plugins.join("_");
    it(
      `should create template with plugins ${pluginsStr}`,
      async () => {
        const cacheDir = `test/create/${testName}`;
        if (!fs.existsSync(cacheDir)) {
          await fs.promises.mkdir(cacheDir);
        }

        await runin(cacheDir, async () => {
          await new CliStartup(
            "test",
            {
              name: pluginsStr,
            },
            {
              packageManager: "npm",
              registry: process.env.REGISTRY as string,
              plugins: pluginsStr,
              force: true,
              env: "native",
              cliVersion: "../../../../",
              skipGit: true,
              skipRun: true,
            }
          )
            .add(CreateMiddleware)
            .run();
        });

        expect(fs.existsSync(cacheDir)).toBeTruthy();
        await fs.promises.rm(cacheDir, {
          recursive: true,
          force: true,
        });
      },
      1000 * 60 * 5
    );
  }

  const file = path.join(__dirname, "../../template/plugin.json");
  const content = fs.readFileSync(file, "utf-8");
  const config: PluginConfig = JSON.parse(content);

  const plugins = config.plugins.map((item) => item.name);
  function selectPlugins(count: number, startIndex = 0): string[][] {
    if (count < 1) return [];
    if (startIndex + count > plugins.length) return [];

    const result: string[][] = [];
    for (let i = startIndex; i <= plugins.length - count; i++) {
      const first = plugins[i];
      const remain = selectPlugins(count - 1, i + 1);
      if (remain.length) {
        remain.forEach((ps) => result.push([first, ...ps]));
      } else {
        result.push([first]);
      }
    }
    return result;
  }

  function testPlugins(count: number) {
    const sels = selectPlugins(count);
    for (const sel of sels) {
      testTemplate(sel);
    }
  }

  // ergodic
  // for (let i = 0; i < plugins.length; i++) {
  //   testPlugins(i + 1);
  // }

  testPlugins(plugins.length);
});
