import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Uploaded memories are intentionally consumed by the web app on a different
  // localhost origin during development and by CDN/web origins in production.
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }));

  // Load Helmet for secure HTTP response headers (XSS protections, Frame guards)
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false, // Allow local Swagger and dev calls
  }));

  // Bind Cookie Parser for JWT Session Extraction
  app.use(cookieParser());

  // JSON Body Constraints to prevent heap exhaustion attacks
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Strict validation rules matching payload classes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Enforce rigid CORS boundaries to mitigate CSRF cross-origin vectors
  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,Cookie',
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Terraflow API Backend is running live on: http://localhost:${port}`);
}

bootstrap();
