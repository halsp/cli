import { runTest } from "./runTest";
import { InquirerService } from "../../src/services/inquirer.service";

runTest(InquirerService, async (ctx, service) => {
  (typeof service.prompt).should.eq("function");
});
