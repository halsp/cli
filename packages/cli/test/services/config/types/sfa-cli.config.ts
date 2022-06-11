import { defineConfig, Configuration } from "@sfajs/cli-common";

export default defineConfig(({ mode }) => {
  return <Configuration>{
    mode: mode,
  };
});
