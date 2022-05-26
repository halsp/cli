import { testTemplateDefault } from "./utils";
import * as fs from "fs";

test(`crlf`, async () => {
  await testTemplateDefault(
    [],
    "crlf.txt",
    (text) => {
      expect(text).toBe("a\r\nb");
    },
    () => {
      fs.writeFileSync("./template/crlf.txt", "a\r\nb");
    }
  );
});
