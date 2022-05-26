//{ router
import { Inject } from "@sfajs/inject";
import { Action } from "@sfajs/router";
import { UserService } from "../services/user.service";

export default class extends Action {
  //{inject
  @Inject
  private readonly userService!: UserService;
  //}

  invoke(): void | Promise<void> {
    //{inject
    //{
    {
      //}
      const userInfo = this.userService.getUserInfo();
      this.ok(userInfo);
      //{
    }
    //}
    //}
  }
}
//}
