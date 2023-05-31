export class ExpressionService {
  public calc(expression: string, flags: string[]) {
    [...flags]
      .sort((a, b) => b.length - a.length)
      .forEach((plugin) => {
        expression = expression.replace(
          new RegExp(
            `(([^a-zA-Z\\-\\_\\.])|^)${plugin}(([^a-zA-Z\\-\\_\\.])|$)`,
            "g"
          ),
          (str) => str.replace(plugin, "↑")
        );
      });
    expression = expression.replace(/[a-zA-Z\-\_\.]+/g, "false");
    expression = expression.replace(new RegExp("↑", "g"), "true");
    return eval(expression) as boolean;
  }
}
