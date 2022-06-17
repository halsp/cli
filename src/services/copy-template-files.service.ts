import { Inject } from "@sfajs/inject";
import * as fs from "fs";
import { FileService } from "./file.service";
import path from "path";
import { CreateEnvService } from "./create-env.service";
import { Plugin } from "../utils/plugins";

export class CreateReadmeService {
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly createEnvService!: CreateEnvService;

  private get targetDir() {
    return this.createEnvService.targetDir;
  }
  private get targetFile() {
    return path.join(this.targetDir, "README.md");
  }
  private get sourceFile() {
    return path.join(__dirname, "../../README.md");
  }

  public async create() {
    await this.fileService.createDir(this.targetFile);
    await fs.promises.copyFile(this.sourceFile, this.targetFile);
  }
}
