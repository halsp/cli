export class ExpressionService {
  public calcPlugins(expression: string, plugins: string[]) {
    [...plugins]
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
