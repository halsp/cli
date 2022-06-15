import path from "path";
import { TsconfigService } from "../../src/services/tsconfig.service";
import { runTest } from "./runTest";

runTest(TsconfigService, async (ctx, service) => {
  expect(service.fileName).toBe("tsconfig.json");
  expect(service.filePath).toBe(path.resolve(process.cwd(), "tsconfig.json"));
  expect(service.outDir).toBe("./dist");
});

runTest(
  TsconfigService,
  async (ctx, service) => {
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

runTest(
  TsconfigService,
  async (ctx, service) => {
    expect(service.fileName).toBe("empty.tsconfig.json");
    expect(service.filePath).toBe(
      path.resolve(process.cwd(), "empty.tsconfig.json")
    );
    expect(service.outDir).toBe("dist");
  },
  undefined,
  {
    tsconfigFile: "empty.tsconfig.json",
  }
);
