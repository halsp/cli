import { SfaHttp } from "@sfajs/http";
import net from "net";

export class TestHttp extends SfaHttp {
  constructor(root?: string) {
    TestHttp["CUSTOM_CONFIG_ROOT"] = root;
    super();
  }
}
