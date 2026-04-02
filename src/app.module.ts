import { Module } from "@nestjs/common";
import { BaseAppService, PageAccessGuard, PagesModule } from "@shared/backend";
import {
	BasicController,
	PagesController,
	TokenController,
} from "./controllers";
import { AppService, AuthService, TokenService } from "./services";
import {
	UsersRepository,
	SettingsRepository,
	UniqueDataSourcesRepository,
} from "./repositories";
import { getFrontendRoot } from "./utils";

@Module({
	imports: [PagesModule.forRoot(getFrontendRoot())],
	controllers: [BasicController, TokenController, PagesController],
	providers: [
		// Services
		AppService,
		{ provide: BaseAppService, useExisting: AppService },
		PageAccessGuard,
		AuthService,
		TokenService,
		// Repositories
		UsersRepository,
		SettingsRepository,
		UniqueDataSourcesRepository,
	],
})
export class AppModule {}
