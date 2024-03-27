import { Inject } from "@halsp/inject";
import path from "path";
import * as fs from "fs";
import { CommandService } from "../command.service";
import { CreateService } from "../create.service";

export class CopyTsconfigService {
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly createService!: CreateService;

  private get targetDir() {
    return this.createService.targetDir;
  }

  public async create(): Promise<void> {
    const isCommonJS = this.commandService.getOptionVlaue<boolean>(
      "commonjs",
      false,
    );
    const fileName = `tsconfig.${isCommonJS ? "cjs" : "mjs"}.json`;
    const sourceFile = path.join(__dirname, `../../../scaffold`, fileName);
    const targetFile = path.join(this.targetDir, "tsconfig.json");
    await fs.promises.copyFile(sourceFile, targetFile);
  }
}
