import * as fs from "fs";
import path from "path";
import { testTemplate } from "./utils";

test(`create template`, async () => {
  await testTemplate((service) => {
    fs.rmSync("./dist/default", {
      recursive: true,
      force: true,
    });

    service.create([], path.join(__dirname, "dist/default"));
    expect(fs.existsSync("dist/default")).toBeTruthy();
    expect(fs.existsSync("dist/default/.eslintrc.js")).toBeTruthy();
    expect(fs.existsSync("dist/default/LICENSE")).toBeTruthy();
  });
});
