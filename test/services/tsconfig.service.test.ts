import { TsconfigService } from "../../src/services/build.services/tsconfig.service";
import { runTest } from "./runTest";
import ts from "typescript";
import path from "path";

runTest(TsconfigService, async (ctx, service) => {
  expect(service.outDir.replace(/\\/g, "/")).toBe(
    path.join(process.cwd(), "dist").replace(/\\/g, "/")
  );
});

runTest(
  TsconfigService,
  async (ctx, service) => {
    expect(() => service.parsedCommandLine).toThrowError(
      "Could not find TypeScript configuration file not-exist.json"
    );
  },
  undefined,
  {
    tsconfigPath: "not-exist.json",
  }
);

runTest(
  TsconfigService,
  async (ctx, service) => {
    expect(service.outDir).toBe("dist");
  },
  undefined,
  {
    tsconfigPath: "empty.tsconfig.json",
  }
);

runTest(TsconfigService, async (ctx, service) => {
  const getParsedCommandLineOfConfigFile = ts.getParsedCommandLineOfConfigFile;
  try {
    ts.getParsedCommandLineOfConfigFile = () => undefined;
    expect(() => service.getParsedCommandLine()).toThrow("failed");
  } finally {
    ts.getParsedCommandLineOfConfigFile = getParsedCommandLineOfConfigFile;
  }
});
