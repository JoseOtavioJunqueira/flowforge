import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './core/users/users.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

// Workspaces, Workflows, Runs, and Metrics modules are designed in
// db/migrations/ but not yet implemented — see README for current status.
@Module({
  imports: [AuthModule, UsersModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
