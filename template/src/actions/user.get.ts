//{ router
import { UseFilters } from "@sfajs/filter";
import { Inject } from "@sfajs/inject";
import { Header } from "@sfajs/pipe";
import { Action } from "@sfajs/router";
//{filter
import { AuthFilter } from "../filters/auth.filter";
//}
//{inject
import { UserService } from "../services/user.service";
//}

//{swagger
/**
 * @openapi
 * /user:
 *   get:
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
 *       400:
 *         description: The account not existing or error password
 *     security:
 *       - password: []
 */
//}
//{filter
@UseFilters(AuthFilter)
//}
export default class extends Action {
  //{inject
  @Inject
  private readonly userService!: UserService;
  //}

  //{pipe
  @Header("host")
  private readonly host!: string;
  //}

  invoke(): void | Promise<void> {
    //{inject
    const userInfo = this.userService.getUserInfo();
    this.ok(userInfo);
    //}

    //{!inject
    this.ok({
      id: 1,
      email: "hi@hal.wang",
    });
    //}
  }
}
//}
