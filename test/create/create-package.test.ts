import path from "path";
import { CopyPackageService } from "../../src/services/scaffold.services/copy-package.service";
import { testService } from "../utils";

describe("create-package", () => {
  it("should not set cli version when dependencies is not exist", async () => {
    await testService(
      CopyPackageService,
      async (ctx, service) => {
        const pkg = {};
        await (service as any).setCliVersion(pkg);
        pkg.should.deep.eq({});
      },
      {
        options: {
          skipEnv: true,
        },
      },
    );
  });

  it("should set cli version with cli path when debug is true", async () => {
    await testService(
      CopyPackageService,
      async (ctx, service) => {
        const pkg = {
          dependencies: {
            "@halsp/cli": "",
          },
          devDependencies: {
            "@halsp/cli": "",
          },
        };
        await (service as any).setCliVersion(pkg);

        const cliPath = path.join(__dirname, "../..");
        pkg.should.deep.eq({
          dependencies: {
            "@halsp/cli": cliPath,
          },
          devDependencies: {
            "@halsp/cli": cliPath,
          },
        });
      },
      {
        options: {
          debug: true,
        },
      },
    );
  });

  it("should not set deps when deps is undefined", async () => {
    await testService(CopyPackageService, async (ctx, service) => {
      await (service as any).setDeps(undefined, [], {}, false);
    });
  });

  it("should remove package when plugin.config.dependencie value is false", async () => {
    await testService(CopyPackageService, async (ctx, service) => {
      const deps = {
        test: "1.1.1",
      };
      await (service as any).setDeps(
        deps,
        [],
        {
          dependencies: {
            test: false,
          },
        },
        false,
      );
      deps.should.deep.eq({});
    });
  });
});
