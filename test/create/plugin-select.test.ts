import inquirer from "inquirer";
import { PluginSelectService } from "../../src/services/create.services/plugin-select.service";
import { testService } from "../utils";

describe("plugin select", () => {
  it("should select plugin by prompt", async () => {
    await testService(PluginSelectService, async (ctx, service) => {
      const prompt = inquirer.prompt;
      inquirer.prompt = (() => Promise.resolve({ plugins: ["inject"] })) as any;
      try {
        const result = await service.select();
        expect(result).toEqual(["inject"]);
      } finally {
        inquirer.prompt = prompt;
      }
    });
  });

  it("should select plugin by prompt with env", async () => {
    await testService(PluginSelectService, async (ctx, service) => {
      const prompt = inquirer.prompt;
      inquirer.prompt = (() => Promise.resolve({ plugins: ["inject"] })) as any;
      try {
        const result = await service.select("http");
        expect(result).toEqual(["inject"]);
      } finally {
        inquirer.prompt = prompt;
      }
    });
  });
});
