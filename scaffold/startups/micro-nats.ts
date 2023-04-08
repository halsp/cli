import { MicroNatsStartup } from "@halsp/micro-nats";
import startup from "./startup";

startup(new MicroNatsStartup()).listen();
