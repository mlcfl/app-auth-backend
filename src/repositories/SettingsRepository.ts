import { Repository } from "@shared/backend";
import { Mongo } from "../lib";
import type { Settings } from "../generated/mongo/client";

// Endpoints should be enabled by default
// Otherwise, the user will need to go to admin settings and enable each endpoint
const defaultSettings: Omit<Settings, "id"> = {
	appEnabled: true,
	endpoints: {
		signUp: true,
		signIn: true,
		restore: true,
	},
} as const;

export class SettingsRepository extends Repository {
	private static readonly id = "settings";

	static async getSettings(): Promise<Omit<Settings, "id">> {
		const settings = await Mongo.settings.findUnique({
			where: { id: this.id },
			omit: { id: true },
		});

		return settings ?? defaultSettings;
	}
}
