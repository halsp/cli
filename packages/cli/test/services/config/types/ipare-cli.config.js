const { defineConfig } = require("@ipare/cli-config");

module.exports = defineConfig(({ mode }) => {
  return {
    packageManager: "cnpm",
  };
});
