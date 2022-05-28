// eslint-disable-next-line @typescript-eslint/no-var-requires
const { defineConfig } = require("../../src/configuration");

export default defineConfig(({ mode }) => {
  return {
    build: {
      prebuild: [
        (cfg) => {
          cfg["prebuild1"] = true;
        },
        (cfg) => {
          cfg["prebuild2"] = true;
          return mode == "production";
        },
        (cfg) => {
          cfg["prebuild3"] = true;
        },
      ],
      postbuild: [
        (cfg) => {
          cfg["postbuild1"] = true;
        },
        (cfg) => {
          cfg["postbuild2"] = true;
        },
      ],
    },
  };
});
