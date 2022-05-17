import { Configuration, defineConfig } from "../../src/configuration";

export default defineConfig((mode) => {
  return <Configuration>{
    mode: mode,
    custom: 1,
  };
});
