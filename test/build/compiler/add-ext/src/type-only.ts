import type * as t from "./test";
export type * from "./test";

const a = 3 as typeof t.test;
console.log("a", a);
