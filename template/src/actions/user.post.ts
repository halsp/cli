//{ router
import { Action } from "@ipare/router";
import { Body } from "@ipare/pipe";
import { V } from "@ipare/validator";
//{pipe
import { LoginDto } from "../dtos/login.dto";
//}

//{swagger
@V()
  .Tags("user")
  .Description("Get user info")
  .Response(200, LoginDto)
  .ResponseDescription(200, "success")
  .ResponseDescription(404, "The account not existing or error password")
//}
export default class extends Action {
  //{pipe
  @Body
  private readonly loginDto!: LoginDto;
  //}

  //{swagger
  @Body("account")
  private readonly account!: string;
  @Body("password")
  private readonly password!: string;
  //}

  async invoke(): Promise<void> {
    //{ pipe
    this.ok(this.loginDto);
    //}

    //{ !pipe
    this.ok({
      id: 1,
      email: "hi@hal.wang",
    });
    //}
  }
}
//}
