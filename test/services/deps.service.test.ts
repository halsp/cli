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
  await runin("../../", () => {
    const interfaces = service.getInterfaces("halspCliTest");
    interfaces.length.should.eq(0);
  });
});

runTest(DepsService, async (ctx, service) => {
  await runin("../../", () => {
    const interfaces = service.getInterfaces(
      "createInject",
      path.resolve("package.json"),
      true,
    );
    interfaces.length.should.eq(1);
  });
});
