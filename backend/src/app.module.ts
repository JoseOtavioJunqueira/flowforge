import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './core/users/users.module';
import { WorkspacesModule } from './core/workspaces/workspaces.module';
import { WorkflowsModule } from './flow/workflows/workflows.module';
import { RunsModule } from './flow/runs/runs.module';
import { MetricsModule } from './flow/metrics/metrics.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    WorkspacesModule,
    WorkflowsModule,
    RunsModule,
    MetricsModule,
  ],
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
