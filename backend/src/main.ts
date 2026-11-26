import 'dotenv/config';
import { initTracer } from './common/tracing/tracer';

// Initialize OpenTelemetry NodeSDK distributed tracing before application bootstrap
void initTracer();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { MmapAssetsService } from './modules/storage/mmap-assets.service';
import {
  buildOpenApi31Document,
  exportOpenApi31SpecToFile,
} from './openapi/openapi-31.builder';
import { TraceInterceptor } from './common/interceptors/trace.interceptor';

async function bootstrap() {
  const isSpecExportOnly = process.env.OPENAPI_EXPORT_ONLY === 'true';
  const app = await NestFactory.create(AppModule, {
    logger: isSpecExportOnly ? ['error'] : undefined,
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });

  // Security HTTP Headers
  app.use((_req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    }
    next();
  });

  // Hardened CORS Configuration
  const allowedOrigins = [
    'https://code-pulse-three.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin === 'https://code-pulse-three.vercel.app' ||
        /^https:\/\/code-pulse(-[a-zA-Z0-9-]+)?\.vercel\.app$/.test(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Interceptors
  app.useGlobalInterceptors(
    new TraceInterceptor(),
    new TransformInterceptor(),
  );

  // Strict OpenAPI 3.1.0 Specification Generation & Export
  const document = buildOpenApi31Document(app);
  const specPath = exportOpenApi31SpecToFile(document);
  SwaggerModule.setup('api/docs', app, document as never);

  if (isSpecExportOnly) {
    console.log(`Exported OpenAPI 3.1.0 schema to ${specPath}`);
    process.exit(0);
  }

  // Hydrate memory-mapped static Monaco assets & WebAssembly runtimes into OS page cache
  const mmapAssets = app.get(MmapAssetsService, { strict: false });
  if (mmapAssets) {
    await mmapAssets.preloadMemoryMappedAssets();
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}/api/v1`);
  console.log(`Swagger OpenAPI 3.1 docs available at: http://0.0.0.0:${port}/api/docs`);
}
void bootstrap();
