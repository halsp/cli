//{ router
import { Action } from "@ipare/router";
//{pipe
import { Body } from "@ipare/pipe";
//}
//{validator
import { IsString, IsNumberString } from "class-validator";
import { ApiDescription, ApiResponses, ApiTags } from "@ipare/swagger";
import { LoginDto } from "../dtos/login.dto";
//}

//{swagger
@ApiTags("user")
@ApiDescription("Get user info")
@ApiResponses({
  "200": {
    description: "success",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/LoginDto",
        },
      },
    },
  },
  "404": {
    description: "The account not existing or error password",
  },
})
//}
export default class extends Action {
  //{pipe
  @Body
  private readonly loginDto!: LoginDto;
  //}

  //{validator
  @IsString()
  @Body("userName")
  private readonly userName!: string;
  @IsNumberString()
  @Body("userId")
  private readonly uid!: string;
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
