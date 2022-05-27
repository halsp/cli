import { Configuration, defineConfig } from "@sfajs/cli";

module.exports = defineConfig(({ mode }) => {
  return <Configuration>{
    mode: mode,
    exports: 1,
  };
});
