import { defineConfig, Configuration } from "@ipare/cli-config";

module.exports = defineConfig(({ mode }) => {
  return <Configuration>{
    mode: mode,
    exports: 1,
  };
});
