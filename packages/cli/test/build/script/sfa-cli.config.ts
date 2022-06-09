import { defineConfig } from "@sfajs/cli-common";

export default defineConfig(({ mode }) => {
  return {
    build: {
      prebuild: [
        ({ config }) => {
          config["prebuild1"] = true;
        },
        ({ config }) => {
          config["prebuild2"] = true;
          return mode == "production";
        },
        ({ config }) => {
          config["prebuild3"] = true;
        },
      ],
      postbuild: [
        ({ config }) => {
          config["postbuild1"] = true;
        },
        ({ config }) => {
          config["postbuild2"] = true;
        },
      ],
    },
  };
});
