import { defineConfig, Configuration } from "../../../../src";

export default defineConfig(({ mode }) => {
  return <Configuration>{
    mode: mode,
  };
});
