import { Repository } from "@shared/backend";

type Toggles = {
	apps: {
		root: boolean;
		auth: boolean;
		welcome: boolean;
	};
	endpoints: {
		auth: {
			signUp: boolean;
			signIn: boolean;
			restore: boolean;
		};
	};
};

const defaultToggles: Toggles = {
	apps: {
		root: false,
		auth: false,
		welcome: false,
	},
	endpoints: {
		auth: {
			signUp: false,
			signIn: false,
			restore: false,
		},
	},
} as const;

export class SettingsRepository extends Repository {
	private static readonly collectionName = "settings";
	private static readonly id = "toggles";
	private static readonly filter = { id: this.id };

	static async getToggles(): Promise<Toggles> {
		const collection = this.mongo.getCollection(this.collectionName);
		const toggles = await collection.findOne<Toggles>(this.filter);

		return toggles
			? {
					apps: { ...defaultToggles.apps, ...toggles.apps },
					endpoints: { ...defaultToggles.endpoints, ...toggles.endpoints },
			  }
			: defaultToggles;
	}
}
