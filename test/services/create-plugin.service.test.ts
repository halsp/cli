import { CopyPluginFileService } from "../../src/services/create.services/copy-plugin-file.service";
import { runTest } from "./runTest";

runTest(CopyPluginFileService, async (ctx, service) => {
  const plugins = await service.copy([]);
  expect(plugins).toEqual(["b"]);
});
