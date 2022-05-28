// eslint-disable-next-line @typescript-eslint/no-var-requires
const { defineConfig } = require("../../src/configuration");

module.exports = defineConfig(({ mode }) => {
  return {
    mode: mode,
    exports: 1,
  };
});
