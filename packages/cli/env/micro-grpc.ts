import { MicroGrpcStartup } from "@ipare/micro-grpc";
import startup from "./startup";

startup(new MicroGrpcStartup()).listen();
