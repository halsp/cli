import { testTemplateDefault } from "./utils";

async function testSelect(select: boolean) {
  test(`template select ${select}`, async () => {
    await testTemplateDefault(
      [select ? "inject" : "router"],
      "select.ts",
      (text) => {
        if (select) {
          expect(text?.trim()).toBe("// INJECT_CONTENT");
        } else {
          expect(text).toBeUndefined();
        }
      }
    );
  });
}

testSelect(true);
testSelect(false);
