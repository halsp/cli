//{filter
import { Context } from "@ipare/core";
import { ActionFilter } from "@ipare/filter";

export class GlobalActionFilter implements ActionFilter {
  onActionExecuted(ctx: Context): void | Promise<void> {
    ctx.res.setHeader("excuted", 1);
  }
  onActionExecuting(
    ctx: Context
  ): boolean | void | Promise<void> | Promise<boolean> {
    ctx.res.setHeader("action", 1);
    return true;
    // return false to intercept
  }
}
//}
