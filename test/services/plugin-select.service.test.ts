import inquirer from "inquirer";
import { PluginSelectService } from "../../src/services/plugin-select.service";
import { runTest } from "./runTest";

runTest(PluginSelectService, async (ctx, service) => {
  const prompt = inquirer.prompt;
  inquirer.prompt = (() => Promise.resolve({ plugins: ["inject"] })) as any;
  try {
    const result = await service.select();
    expect(result).toEqual(["inject"]);
  } finally {
    inquirer.prompt = prompt;
  }
});

runTest(PluginSelectService, async (ctx, service) => {
  const plugins = await service.fixPlugins(["inject"], process.cwd());
  expect(plugins.length).toBeGreaterThan(1);
});
