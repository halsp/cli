import { Configuration, defineConfig } from "@sfajs/cli";
import "@sfajs/router";

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
