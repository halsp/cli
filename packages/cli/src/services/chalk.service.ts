type ChalkMethod = ((s: any) => string) & { bold: ChalkMethod };

export class ChalkService {
  async init() {
    const { default: chalk } = await import("chalk");

    [
      "black",
      "red",
      "green",
      "yellow",
      "blue",
      "magenta",
      "cyan",
      "white",
    ].forEach((property) => {
      this[property] = chalk[property];
      this[property + "Bright"] = chalk[property + "Bright"];
    });
    this["bold"] = chalk["bold"] as any;
  }
}

export interface ChalkService {
  bold: ChalkMethod & ChalkService;
  black: ChalkMethod;
  blackBright: ChalkMethod;
  red: ChalkMethod;
  redBright: ChalkMethod;
  green: ChalkMethod;
  greenBright: ChalkMethod;
  yellow: ChalkMethod;
  yellowBright: ChalkMethod;
  blue: ChalkMethod;
  blueBright: ChalkMethod;
  magenta: ChalkMethod;
  magentaBright: ChalkMethod;
  cyan: ChalkMethod;
  cyanBright: ChalkMethod;
  white: ChalkMethod;
  whiteBright: ChalkMethod;
}
