import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { getAppName } from "@shared/backend";
import packageJson from "../../package.json" assert { type: "json" };

const findPackageRoot = (startDir: string): string => {
	let dir = startDir;

	while (!existsSync(resolve(dir, "package.json"))) {
		const parent = dirname(dir);

		if (parent === dir) {
			throw new Error("Could not find package root");
		}

		dir = parent;
	}

	return dir;
};

let path: string | null = null;

export const getFrontendRoot = () => {
	if (!path) {
		const pkgRoot = findPackageRoot(import.meta.dirname);
		path = resolve(pkgRoot, `../${getAppName(packageJson)}-frontend`);
	}

	return path;
};
