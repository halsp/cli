import { runTest } from "./runTest";
import inquirer from "inquirer";

runTest(InquirerService, async (ctx, service) => {
  (typeof service.prompt).should.eq("function");
});
