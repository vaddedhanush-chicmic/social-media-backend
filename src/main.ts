import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // WebSocket Adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Global Prefix
  app.setGlobalPrefix(configService.get<string>('app.apiPrefix') || 'api/v1');

  // Cookies
  app.use(cookieParser());

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Social Media API')
    .setDescription('The Social Media Application API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  await app.listen(configService.get<number>('app.port') || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation available at: ${await app.getUrl()}/docs`);
}
bootstrap();