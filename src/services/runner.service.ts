import { ChildProcess, spawn, SpawnOptions } from "child_process";
import _ from "lodash";

export class RunnerService {
  public async run(
    pm: string,
    command: string,
    options?: SpawnOptions
  ): Promise<boolean> {
    const args: string[] = [command];
    const opts = _.merge(
      {
        cwd: process.cwd(),
        stdio: "inherit",
        shell: true,
      } as SpawnOptions,
      options
    );

    return new Promise<boolean>((resolve) => {
      const child: ChildProcess = spawn(pm, args, opts);
      child.on("close", (code) => {
        resolve(!code);
      });
    });
  }
}
