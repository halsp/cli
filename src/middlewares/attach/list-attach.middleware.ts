import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { AttachService } from "../../services/attach.service";
import { ChalkService } from "../../services/chalk.service";

export class ListAttachMiddleware extends Middleware {
  @Inject
  private readonly attachService!: AttachService;
  @Inject
  private readonly chalkService!: ChalkService;

  async invoke() {
    const attachs = await this.attachService.get();
    if (!attachs.length) {
      this.logger.info("No attachs.");
      return;
    }

    this.logger.info("Attachs:");
    attachs.forEach((item, index) => {
      const pkg = this.chalkService.blueBright(item.package);
      this.logger.info(`  ${index + 1}. ${pkg}`);
    });

    await this.next();
  }
}
