import { defineConfig, Configuration } from "../../../../src";

module.exports = defineConfig(({ mode }) => {
  return <Configuration>{
    mode: mode,
    exports: 1,
  };
});
