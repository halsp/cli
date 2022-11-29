import { MicroNatsStartup } from "@ipare/micro-nats";
import startup from "./startup";

startup(new MicroNatsStartup()).listen();
