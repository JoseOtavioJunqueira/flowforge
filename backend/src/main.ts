import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // All routes live under /api so the same paths work locally and on Vercel
  // (where /api/* is routed to this service).
  app.setGlobalPrefix('api');
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}

if (process.env.VERCEL) {
  // On Vercel node_modules is not shipped with the function, so load the
  // self-contained bundle built by `npm run bundle` (see package.json).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../bundle/server.cjs');
} else {
  void bootstrap();
}
