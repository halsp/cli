const { defineConfig } = require("../../../../src");

module.exports = defineConfig(({ mode }) => {
  return {
    start: {
      startupFile: "t1",
    },
  };
});
