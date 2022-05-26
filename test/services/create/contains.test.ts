import { testTemplateDefault } from "./utils";

async function testContains(contains: boolean) {
  test(`template contains ${contains}`, async () => {
    await testTemplateDefault(
      contains ? ["router", "mva"] : ["router"],
      "contains.ts",
      (text) => {
        if (contains) {
          expect(text?.trim()?.split("\n")?.at(0)?.trim()).toBe(
            "// ROUTER_CONTENT"
          );
        } else {
          expect(text?.trim()?.split("\n")?.at(0)?.trim()).toBe(
            "// CONTAINS_CONTENT"
          );
        }
      }
    );
  });
}

testContains(true);
testContains(false);
