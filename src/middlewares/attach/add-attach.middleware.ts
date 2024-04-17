import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { PackageManagerService } from "../../services/package-manager.service";
import { AttachService } from "../../services/attach.service";
import { ChalkService } from "../../services/chalk.service";

export class AddAttachMiddleware extends Middleware {
  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly attachService!: AttachService;
  @Inject
  private readonly chalkService!: ChalkService;

  async invoke() {
    const names = this.attachService.names;
    const dependencies: string[] = [];
    if (!(await this.installAttachs(names, dependencies))) {
      return;
    }

    this.logger.info("Attach success:");
    names.forEach((name, index) => {
      const cName = this.chalkService.greenBright(name);
      this.logger.info(`  ${index + 1}. ${cName}`);
    });

    if (dependencies.length) {
      this.logger.info("Dependencies:");
      dependencies.forEach((name, index) => {
        const cName = this.chalkService.blueBright(name);
        this.logger.info(`  ${index + 1}. ${cName}`);
      });
    }
  }

  private async installAttachs(names: string[], dependencies: string[]) {
    if (!(await this.install(names))) {
      return false;
    }

    const attachs = await this.attachService.get();
    if (!attachs.length) {
      return false;
    }

    const deps = names
      .reduce<string[]>((pre, cur) => {
        let pkgDeps =
          attachs.filter((a) => a.package == cur)[0]?.config?.dependencies ??
          [];
        if (typeof pkgDeps == "string") {
          pkgDeps = pkgDeps
            .split(",")
            .map((item) => item.trim())
            .filter((item) => !!item);
        }
        for (const dep of pkgDeps) {
          if (!pre.includes(dep)) {
            pre.push(dep);
          }
        }
        return pre;
      }, [])
      .filter((dep) => !dependencies.some((d) => d == dep));
    dependencies.push(...deps);
    if (!!deps.length) {
      return await this.installAttachs(deps, dependencies);
    }
    return true;
  }

  private async install(names: string[]) {
    const installResult = await this.packageManagerService.add(
      names,
      undefined,
      this.attachService.cacheDir,
    );
    return installResult.status == 0;
  }
}
