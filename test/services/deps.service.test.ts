import { DepsService } from "../../src/services/deps.service";
import { runTest } from "./runTest";
import path from "path";

runTest(DepsService, async (ctx, service) => {
  const deps = service.getPackageIpareDeps("@ipare/inject");
  expect(Array.isArray(deps)).toBeTruthy();
  expect(deps.length > 0).toBeTruthy();

  const depPath = (service as any).getPackagePath("@ipare/inject");
  const pkgPath = path.join(
    __dirname,
    "../../node_modules/@ipare/inject/package.json"
  );
  expect(depPath).toBe(pkgPath);
});

runTest(DepsService, async (ctx, service) => {
  const depPath = (service as any).getPackagePath("@ipare/inject");
  const deps = service.getDeps(depPath, () => false);
  expect(Array.isArray(deps)).toBeTruthy();
  expect(deps.length).toBe(0);
});
