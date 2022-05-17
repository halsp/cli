import { Configuration, defineConfig } from "../../src/configuration";

export default defineConfig((mode) => {
  return <Configuration>{
    mode: mode,
    services: {
      "from-config": 1,
      "": 2,
    },
  };
});
