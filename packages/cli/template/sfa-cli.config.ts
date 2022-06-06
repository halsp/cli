import { defineConfig } from "@sfajs/cli";
import { routerPostBuild } from "@sfajs/router";
import "@sfajs/router";

export default defineConfig(() => ({
  build: {
    assets: [
      //{views
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
    //{router
    postbuild: [routerPostBuild],
    //}
  },
  packageManager: "{{PACKAGE_MANAGER}}",
}));
