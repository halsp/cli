import {
  SpawnSyncOptionsWithStringEncoding,
  SpawnSyncOptionsWithBufferEncoding,
  SpawnSyncReturns,
} from "child_process";
import spawn from "cross-spawn";
import _ from "lodash";

export class RunnerService {
  public run(
    command: string,
    args?: string[] | string,
    options?: SpawnSyncOptionsWithStringEncoding,
  ): SpawnSyncReturns<string>;
  public run(
    command: string,
    args?: string[] | string,
    options?: SpawnSyncOptionsWithBufferEncoding,
  ): SpawnSyncReturns<Buffer>;
  public run(
    command: string,
    args: string[] | string = [],
    options?:
      | SpawnSyncOptionsWithStringEncoding
      | SpawnSyncOptionsWithBufferEncoding,
  ): SpawnSyncReturns<string> | SpawnSyncReturns<Buffer> {
    const opts = _.merge(
      {
        cwd: process.cwd(),
        stdio: "inherit",
        encoding: "utf-8",
      } as SpawnSyncOptionsWithStringEncoding,
      options,
    );

    if (!Array.isArray(args)) {
      args = [args];
    }
    return spawn.sync(command, args, opts);
  }
}
