import { defineConfig, PackageManager } from "@sfajs/cli-common";

export default defineConfig((e) => ({
  packageManager: "{{PACKAGE_MANAGER}}" as PackageManager,
}));
