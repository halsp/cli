import { defineConfig, Configuration } from "@sfajs/cli-common";

module.exports = defineConfig(({ mode }) => {
  return <Configuration>{
    mode: mode,
    exports: 1,
  };
});
