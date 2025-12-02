import { Repository } from "@shared/backend";
import { Mongo } from "../lib";
import type { Settings } from "../generated/mongo/client";

const defaultSettings: Omit<Settings, "id"> = {
	appEnabled: false,
	endpoints: {
		signUp: false,
		signIn: false,
		restore: false,
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
