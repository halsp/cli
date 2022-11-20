import { MicroTcpStartup } from "@ipare/micro-tcp";
import startup from "./startup";

startup(new MicroTcpStartup(), "production").listen();
