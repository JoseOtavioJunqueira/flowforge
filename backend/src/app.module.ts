import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './core/users/users.module';
import { WorkflowsModule } from './core/workflows/workflows.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

// Workflows, runs and metrics run in memory for now; workspaces and the
// Postgres persistence layer are designed in db/migrations/ but not built yet.
@Module({
  imports: [AuthModule, UsersModule, WorkflowsModule],
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
