import { Repository } from "@shared/backend";
import type { UniqueData } from "../helpers";

export class UniqueDataSourcesRepository extends Repository {
	private static readonly collectionName = "uniqueDataSources";
	private static readonly id = "loginData";
	private static readonly filter = { id: this.id };

	static async getLoginData(): Promise<UniqueData | null> {
		const collection = this.mongo.getCollection(this.collectionName);

		return await collection.findOne<UniqueData>(this.filter);
	}

	static async setLoginData(data: UniqueData): Promise<void> {
		const collection = this.mongo.getCollection(this.collectionName);
		const document = { ...data, id: this.id };
		const options = { upsert: true };

		await collection.updateOne(this.filter, { $set: document }, options);
	}
}
