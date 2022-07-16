import { Configuration, defineConfig } from "@ipare/cli";
import "@ipare/router/dist/cli-config";

export default defineConfig(() => {
  return <Configuration>{
    build: {
      assets: [
        //{view
        {
          include: "views/*",
          root: "src",
        },
        //}
        //{static
        {
          include: "static/*",
        },
        //}
      ],
    },
    packageManager: "{{PACKAGE_MANAGER}}",
  };
});
