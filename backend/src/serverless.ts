import { NestFactory } from '@nestjs/core';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';

// Vercel serverless entry: build the Nest app once per cold start and reuse the
// underlying Express instance as the request handler.
let cached: ((req: Request, res: Response) => void) | undefined;

async function getHandler() {
  if (!cached) {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    app.enableCors();
    await app.init();
    cached = app.getHttpAdapter().getInstance();
  }
  return cached!;
}

export default async function handler(req: Request, res: Response) {
  const h = await getHandler();
  return h(req, res);
}
