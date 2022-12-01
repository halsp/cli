import path from "path";
import { CreatePackageService } from "../../src/services/create.services/create-package.service";
import { testService } from "../utils";

describe("create-package", () => {
  it("should not set cli version when dependencies is not exist", async () => {
    await testService(
      CreatePackageService,
      async (ctx, service) => {
        const pkg = {};
        await (service as any).setCliVersion(pkg);
        expect(pkg).toEqual({});
      },
      {
        options: {
          skipEnv: true,
        },
      }
    );
  });

  it('should set cli version with cli path when cliVersion = "cli-test"', async () => {
    await testService(
      CreatePackageService,
      async (ctx, service) => {
        const pkg = {
          dependencies: {
            "@ipare/cli": "",
          },
          devDependencies: {
            "@ipare/cli": "",
          },
        };
        await (service as any).setCliVersion(pkg);

        const cliPath = path.join(__dirname, "../..");
        expect(pkg).toEqual({
          dependencies: {
            "@ipare/cli": cliPath,
          },
          devDependencies: {
            "@ipare/cli": cliPath,
          },
        });
      },
      {
        options: {
          cliVersion: "cli-test",
        },
      }
    );
  });

  it("should not set deps when deps is undefined", async () => {
    await testService(CreatePackageService, async (ctx, service) => {
      await (service as any).setDeps(undefined, [], {}, false);
    });
  });

  it("should remove package when plugin.config.dependencie value is false", async () => {
    await testService(CreatePackageService, async (ctx, service) => {
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
        false
      );
      expect(deps).toEqual({});
    });
  });
});
