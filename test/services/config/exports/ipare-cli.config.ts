import { defineConfig, Configuration } from "@ipare/cli-common";

module.exports = defineConfig(({ mode }) => {
  return <Configuration>{
    mode: mode,
    exports: 1,
  };
});
