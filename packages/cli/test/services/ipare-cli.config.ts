import { defineConfig, Configuration } from "@ipare/cli-config";

export default defineConfig(({ mode }) => {
  return <Configuration>{
    mode: mode,
    services: {
      "from-config": 1,
      "": 2,
    },
  };
});
