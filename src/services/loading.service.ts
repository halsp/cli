import ora from "ora";

export class LoadingService {
  private spinner: ora.Ora | undefined;
  public start(options?: string | ora.Options) {
    this.spinner?.stop();
    this.spinner = ora(options);
    this.spinner.start();
  }

  public succeed(text?: string) {
    this.spinner?.succeed(text);
    this.spinner = undefined;
  }

  public fail(text?: string) {
    this.spinner?.fail(text);
    this.spinner = undefined;
  }
}
