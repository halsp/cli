import { allPlugins, Plugin } from "../../src/utils/plugins";
import { runin } from "../utils";
import { CliStartup } from "../../src/cli-startup";
import { CreateMiddleware } from "../../src/middlewares/create-middleware";
import * as fs from "fs";

function testTemplate(plugins: Plugin[]) {
  const pluginsStr = plugins.join(",");
  test(
    `create template ${pluginsStr}`,
    async () => {
      const cacheDir = "test/middlewares/create-cache";
      if (!fs.existsSync(cacheDir)) {
        await fs.promises.mkdir(cacheDir);
      }

      await runin(cacheDir, async () => {
        await new CliStartup(
          {
            name: pluginsStr,
          },
          {
            packageManager: "npm",
            plugins: pluginsStr,
            force: true,
            env: "http",
            cliVersion: "../../../../",
          }
        )
          .add(CreateMiddleware)
          .run();
      });
    },
    1000 * 60 * 5
  );
}

const plugins = allPlugins.map((item) => item.value as Plugin);
function selectPlugins(count: number, startIndex = 0): Plugin[][] {
  if (count < 1) return [];
  if (startIndex + count > plugins.length) return [];

  const result: Plugin[][] = [];
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

for (let i = 0; i < plugins.length; i++) {
  testPlugins(i + 1);
}
