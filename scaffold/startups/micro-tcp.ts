import { MicroTcpStartup } from "@halsp/micro-tcp";
import startup from "./startup";

startup(new MicroTcpStartup()).listen();
