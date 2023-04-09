import { parseInject } from "@halsp/inject";
import { PluginSelectService } from "../../src/services/create.services/plugin-select.service";
import { InquirerService } from "../../src/services/inquirer.service";
import { testService } from "../utils";

describe("plugin select", () => {
  it("should select plugin by prompt", async () => {
    await testService(PluginSelectService, async (ctx, service) => {
      const inquirerService = await parseInject(ctx, InquirerService);
      Object.defineProperty(inquirerService, "prompt", {
        value: () => Promise.resolve({ plugins: ["inject"] }),
      });

      const result = await service.select();
      result.should.deep.eq(["inject"]);
    });
  });

  it("should select plugin by prompt with env", async () => {
    await testService(PluginSelectService, async (ctx, service) => {
      const inquirerService = await parseInject(ctx, InquirerService);
      Object.defineProperty(inquirerService, "prompt", {
        value: () => Promise.resolve({ plugins: ["inject"] }),
      });

      const result = await service.select("http");
      result.should.deep.eq(["inject"]);
    });
  });
});
