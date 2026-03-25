import { Module } from "@nestjs/common";
import { PagesModule } from "@shared/backend";
import { BasicController, PagesController } from "./controllers";
import { AppService, AuthService, TokenService } from "./services";
import {
	UsersRepository,
	SettingsRepository,
	UniqueDataSourcesRepository,
} from "./repositories";
import { getFrontendRoot } from "./utils";

@Module({
	imports: [PagesModule.forRoot(getFrontendRoot())],
	controllers: [BasicController, PagesController],
	providers: [
		// Services
		AppService,
		AuthService,
		TokenService,
		// Repositories
		UsersRepository,
		SettingsRepository,
		UniqueDataSourcesRepository,
	],
})
export class AppModule {}
