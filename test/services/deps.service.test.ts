import { DepsService } from "../../src/services/deps.service";
import { runTest } from "./runTest";
import path from "path";

runTest(DepsService, async (ctx, service) => {
  const deps = service.getPackageHalspDeps("@halsp/inject");
  Array.isArray(deps).should.true;
  (deps.length > 0).should.true;

  const depPath = (service as any).getPackagePath("@halsp/inject");
  const pkgPath = path.join(
    __dirname,
    "../../node_modules/@halsp/inject/package.json",
  );
  depPath.should.eq(pkgPath);
});

runTest(DepsService, async (ctx, service) => {
  const depPath = (service as any).getPackagePath("@halsp/inject");
  const deps = service.getDeps(depPath, () => false);
  Array.isArray(deps).should.true;
  deps.length.should.eq(0);
});
