import { DepsService } from "../../src/services/deps.service";
import { runin } from "../utils";
import { runTest } from "./runTest";
import path from "path";

runTest(DepsService, async (ctx, service) => {
  const deps = service.getPackageHalspDeps("@halsp/inject");
  Array.isArray(deps).should.true;
  (deps.length > 0).should.true;

  const depPath: string = (service as any).getPackagePath("@halsp/inject");
  const pkgPath = path.join("node_modules/@halsp/inject/package.json");
  depPath.endsWith(pkgPath).should.true;
});

runTest(DepsService, async (ctx, service) => {
  const depPath = (service as any).getPackagePath("@halsp/inject");
  const deps = service["getDeps"](depPath, () => false);
  Array.isArray(deps).should.true;
  deps.length.should.eq(0);
});

runTest(DepsService, async (ctx, service) => {
  await runin("../../", async () => {
    const interfaces = await service.getInterfaces("halspCliTest");
    interfaces.length.should.eq(0);
  });
});

runTest(DepsService, async (ctx, service) => {
  await runin("../../", async () => {
    const interfaces = await service.getInterfaces(
      "createInject",
      process.cwd(),
    );
    interfaces.length.should.eq(1);
  });
});

runTest(DepsService, async (ctx, service) => {
  await runin("../../", async () => {
    const deps = service.getPackageHalspDeps("not-exist", [process.cwd()]);
    deps.length.should.eq(0);
  });
});
