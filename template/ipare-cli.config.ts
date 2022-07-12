import { Configuration, defineConfig } from "@ipare/cli";
import "@ipare/router";

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
