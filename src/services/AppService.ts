import { Injectable } from "@nestjs/common";
import { getAppName } from "@shared/backend";
import { getFrontendRoot } from "../utils";
import packageJson from "../../package.json" assert { type: "json" };

@Injectable()
export class AppService {
	readonly appName = getAppName(packageJson);
	readonly frontendRoot = getFrontendRoot();
}
