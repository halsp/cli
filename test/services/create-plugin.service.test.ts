import { CreatePluginService } from "../../src/services/create-plugin.service";
import { runTest } from "./runTest";
import glob from "glob";

runTest(CreatePluginService, async (ctx, service) => {
  service.getPluginConfig = async () => ({
    files: {
      a: true,
      b: false,
    },
    dependencies: {},
    constant: [],
  });
  glob.sync = (arg) => [arg];

  const plugins = await service.excludePluginFiles([]);
  expect(plugins).toEqual(["b"]);
});
