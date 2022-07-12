import { defineConfig, Configuration } from "@ipare/cli-common";

export default defineConfig(({ mode }) => {
  return <Configuration>{
    mode: mode,
  };
});
