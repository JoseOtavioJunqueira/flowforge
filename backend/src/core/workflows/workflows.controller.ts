import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { WorkflowsService, StepInput } from './workflows.service';

interface AuthedRequest {
  user: { userId: string; email: string };
}

@Controller()
export class WorkflowsController {
  constructor(private readonly workflows: WorkflowsService) {}

  @Get('workflows')
  list(@Req() req: AuthedRequest) {
    return this.workflows.list(req.user.userId);
  }

  @Post('workflows')
  create(
    @Req() req: AuthedRequest,
    @Body() body: { name?: string; description?: string; steps?: StepInput[] },
  ) {
    return this.workflows.create(req.user.userId, body);
  }

  @Delete('workflows/:id')
  remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.workflows.remove(req.user.userId, id);
  }

  @Post('workflows/:id/runs')
  run(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.workflows.run(req.user.userId, id);
  }

  @Get('runs')
  runs(@Req() req: AuthedRequest) {
    return this.workflows.listRuns(req.user.userId);
  }

  @Get('metrics')
  metrics(@Req() req: AuthedRequest) {
    return this.workflows.metrics(req.user.userId);
  }
}
