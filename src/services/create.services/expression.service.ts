export class ExpressionService {
  public calcPlugins(expression: string, plugins: string[]) {
    plugins.forEach((plugin) => {
      expression = expression.replace(new RegExp(plugin, "g"), "↑");
    });
    expression = expression.replace(/[a-zA-Z]+/g, "false");
    expression = expression.replace(new RegExp("↑", "g"), "true");
    return eval(expression) as boolean;
  }
}
