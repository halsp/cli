import { Middleware } from "@sfajs/core";
import { SfaHttp } from "@sfajs/http";
import { Inject } from "@sfajs/inject";
import path from "path";
import { ConfigService } from "../services/config.service";
import { TsconfigService } from "../services/tsconfig.service";
import { SetupStartup } from "../setup-startup";
import chalk from "chalk";
import { CommandService } from "../services/command.service";

// TODO: remove dist
export class StartMiddleware extends Middleware {
  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly commandService!: CommandService;

  private get outDir() {
    return this.tsconfigService.outDir;
  }
  private get debug() {
    return this.commandService.getOptionVlaue<boolean>("debug", false);
  }
  private get mode() {
    return this.commandService.getOptionVlaue<string>("mode", "production");
  }
  private get enterFile() {
    return this.commandService.getOptionVlaue<string>("entryFile", "startup");
  }

  async invoke(): Promise<void> {
    await this.next();

    const outDir = this.tsconfigService.outDir;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const setupStartup: SetupStartup<SfaHttp> = require(path.resolve(
      process.cwd(),
      outDir,
      "startup"
    )).default;
    const startup = await setupStartup(
      new SfaHttp().useHttpJsonBody(),
      this.mode
    );
    startup.use(async (ctx, next) => {
      console.log(ctx.req.method, ctx.req.path);
      await next();
    });
    const { server, port } = await startup.dynamicListen(
      this.configService.value.start?.port ?? 2333
    );
    console.log(chalk.blue(`start: http://localhost:${port}`));
    this.ok({
      server,
    });
  }
}
