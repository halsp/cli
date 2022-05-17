import path from "path";
import { TsconfigService } from "../../src/services/tsconfig.service";
import { runTest } from "./runTest";

runTest(TsconfigService, async (res, service) => {
  expect(service.fileName).toBe("tsconfig.json");
  expect(service.filePath).toBe(path.resolve(process.cwd(), "tsconfig.json"));
  expect(service.outDir).toBe("./dist");
});

runTest(
  TsconfigService,
  async (res, service) => {
    expect(service.fileName).toBe("not-exist.json");
    expect(service.filePath).toBe(
      path.resolve(process.cwd(), "not-exist.json")
    );
    expect(() => service.value).toThrowError(
      "Could not find TypeScript configuration file not-exist.json"
    );
  },
  undefined,
  {
    tsconfigFile: "not-exist.json",
  }
);

// runTest(
//   ConfigService,
//   async (res, service) => {
//     expect(service.mode).toBe("test");
//     expect(service.configFilePath).toBe(
//       path.resolve(process.cwd(), "custom.config.ts")
//     );
//     expect(service.value).toEqual({
//       custom: 1,
//       mode: "test",
//     });
//     return;
//   },
//   undefined,
//   {
//     configName: "custom.config.ts",
//     mode: "test",
//   }
// );
