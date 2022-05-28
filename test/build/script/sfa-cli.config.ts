// eslint-disable-next-line @typescript-eslint/no-var-requires
const { defineConfig } = require("../../src/configuration");

export default defineConfig(({ mode }) => {
  return {
    build: {
      prebuild: [
        (ctx) => {
          ctx["prebuild1"] = true;
        },
        (ctx) => {
          ctx["prebuild2"] = true;
          return mode == "production";
        },
        (ctx) => {
          ctx["prebuild3"] = true;
        },
      ],
      postbuild: [
        (ctx) => {
          ctx["postbuild1"] = true;
        },
        (ctx) => {
          ctx["postbuild2"] = true;
        },
      ],
    },
  };
});
