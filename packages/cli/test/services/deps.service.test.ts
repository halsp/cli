import { DepsService } from "../../src/services/deps.service";
import { runTest } from "./runTest";
import path from "path";

runTest(DepsService, async (ctx, service) => {
  const deps = service.getPackageSfaDeps("@sfajs/inject");
  expect(Array.isArray(deps)).toBeTruthy();
  expect(deps.length > 0).toBeTruthy();

  const depPath = (service as any).getPackagePath("@sfajs/inject");
  const pkgPath = path.join(
    __dirname,
    "../../node_modules/@sfajs/inject/package.json"
  );
  expect(depPath).toBe(pkgPath);
});
