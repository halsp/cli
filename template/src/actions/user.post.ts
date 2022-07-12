//{ router
import { Action } from "@ipare/router";
//{pipe
import { Body } from "@ipare/pipe";
//}
//{validator
import { IsString, IsNumberString } from "class-validator";
//}

//{swagger
/**
 * @openapi
 * /user:
 *   post:
 *     tags:
 *       - user
 *     description: Get user info
 *     requestBody:
 *       description: User info
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               account:
 *                 type: string
 *                 description: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/user'
 *       404:
 *         description: The account not existing or error password
 */
//}
export default class extends Action {
  //{pipe
  @Body
  private readonly userInfo!: any;
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
    this.ok(this.userInfo);
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
