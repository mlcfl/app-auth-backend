import { Repository } from "@shared/backend";
import { Mongo } from "../lib";
import type { UniqueDataSources } from "../generated/mongo/client";

export class UniqueDataSourcesRepository extends Repository {
	private static readonly id = "login";

	static async getLoginData(): Promise<Omit<UniqueDataSources, "id"> | null> {
		return await Mongo.uniqueDataSources.findUnique({
			where: { id: this.id },
			omit: { id: true },
		});
	}

	static async setLoginData(
		data: Omit<UniqueDataSources, "id">
	): Promise<void> {
		const document = { ...data, id: this.id };

		await Mongo.uniqueDataSources.upsert({
			where: { id: this.id },
			create: document,
			update: document,
			omit: { id: true },
		});
	}
}
