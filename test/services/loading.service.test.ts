import { runTest } from "./runTest";
import { LoadingService } from "../../src/services/loading.service";

runTest(LoadingService, async (ctx, service) => {
  service.start();
  service.start("start");

  service.succeed();
  service.succeed("succeed");

  service.start();
  service.fail();
  service.fail("fail");
});
