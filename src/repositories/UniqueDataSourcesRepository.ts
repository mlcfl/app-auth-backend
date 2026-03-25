import { Injectable } from "@nestjs/common";
import { Mongo } from "../lib";
import type { UniqueDataSources } from "../generated/mongo/client";

@Injectable()
export class UniqueDataSourcesRepository {
	private readonly id = "login";

	async getLoginData(): Promise<Omit<UniqueDataSources, "id"> | null> {
		return await Mongo.uniqueDataSources.findUnique({
			where: { id: this.id },
			omit: { id: true },
		});
	}

	async setLoginData(data: Omit<UniqueDataSources, "id">): Promise<void> {
		await Mongo.uniqueDataSources.upsert({
			where: { id: this.id },
			create: data,
			update: data,
			omit: { id: true },
		});
	}
}
