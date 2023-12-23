import { DepsService } from "../../src/services/deps.service";
import { runin } from "../utils";
import { runTest } from "./runTest";
import path from "path";
import fs from "fs";
import { FileService } from "../../src/services/file.service";

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

  {
    const deps = service["getDeps"](depPath, () => true);
    Array.isArray(deps).should.true;
    deps.length.should.greaterThan(0);
  }

  {
    const deps = service["getDeps"](depPath, () => false);
    Array.isArray(deps).should.true;
    deps.length.should.eq(0);
  }
});

runTest(DepsService, async (ctx, service) => {
  const deps = service["getDeps"]("./not-exist", () => true);
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

runTest(DepsService, async (ctx, service) => {
  const moduleName = ".cache-deps-load-error";
  await runin(moduleName, async () => {
    const fileService = await ctx.getService(FileService);
    const dir = path.resolve(`node_modules/${moduleName}`);
    const pkgPath = path.resolve(`${dir}/package.json`);
    const jsPath = path.resolve(`${dir}/index.js`);
    await fileService.createDir(pkgPath);
    await fs.promises.writeFile(
      pkgPath,
      JSON.stringify({
        name: "deps-load-error",
        main: "./index.js",
      }),
    );
    await fs.promises.writeFile(jsPath, 'throw new Error("");');
    service["getPackagePath"] = () => [moduleName] as any;
    service["getDeps"] = () =>
      [
        {
          key: moduleName,
        },
      ] as any;
    const deps = await service.getPlugins(moduleName);
    deps.length.should.eq(0);
  });
});
