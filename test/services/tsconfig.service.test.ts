import { TsconfigService } from "../../src/services/tsconfig.service";
import { runTest } from "./runTest";

runTest(TsconfigService, async (ctx, service) => {
  expect(service.outDir).toBe("./dist");
});

runTest(
  TsconfigService,
  async (ctx, service) => {
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
    expect(service.outDir).toBe("dist");
  },
  undefined,
  {
    tsconfigFile: "empty.tsconfig.json",
  }
);
