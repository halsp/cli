import { PluginSelectService } from "../../src/services/scaffold.services/plugin-select.service";
import { testService } from "../utils";

describe("plugin select", () => {
  it("should select plugin by prompt", async () => {
    await testService(PluginSelectService, async (ctx, service) => {
      const inquirer = await import("inquirer");
      Object.defineProperty(inquirer, "prompt", {
        value: () => Promise.resolve({ plugins: ["inject"] }),
      });

      const result = await service.select();
      result.should.deep.eq(["inject"]);
    });
  });

  it("should select plugin by prompt with env", async () => {
    await testService(PluginSelectService, async (ctx, service) => {
      const inquirer = await import("inquirer");
      Object.defineProperty(inquirer, "prompt", {
        value: () => Promise.resolve({ plugins: ["inject"] }),
      });

      const result = await service.select("http");
      result.should.deep.eq(["inject"]);
    });
  });
});
