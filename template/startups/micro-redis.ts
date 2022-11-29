import { MicroRedisStartup } from "@ipare/micro-redis";
import startup from "./startup";

startup(new MicroRedisStartup()).listen();
