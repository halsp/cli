import { DepsService } from "../../src/services/deps.service";
import { runTest } from "./runTest";
import path from "path";

runTest(DepsService, async (ctx, service) => {
  const deps = service.getPackageHalspDeps("@halsp/inject");
  expect(Array.isArray(deps)).toBeTruthy();
  expect(deps.length > 0).toBeTruthy();

  const depPath = (service as any).getPackagePath("@halsp/inject");
  const pkgPath = path.join(
    __dirname,
    "../../node_modules/@halsp/inject/package.json"
  );
  expect(depPath).toBe(pkgPath);
});

runTest(DepsService, async (ctx, service) => {
  const depPath = (service as any).getPackagePath("@halsp/inject");
  const deps = service.getDeps(depPath, () => false);
  expect(Array.isArray(deps)).toBeTruthy();
  expect(deps.length).toBe(0);
});
