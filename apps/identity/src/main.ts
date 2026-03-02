import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IdentityModule } from './identity.module';

/**
 * Bootstrap function for Identity Service
 * 
 * This service handles:
 * - User registration
 * - User authentication (login/logout)
 * - JWT token management
 * - Role management (BUYER, SELLER, ADMIN, ENABLER)
 * - Email verification with OTP
 * - KYC placeholder endpoints
 */
async function bootstrap() {
    const logger = new Logger('IdentityService');
    const isProduction = process.env.NODE_ENV === 'production';

    const app = await NestFactory.create(IdentityModule, {
        logger: isProduction
            ? ['error', 'warn', 'log']
            : ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Enable CORS for frontend communication
    const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        process.env.CORS_ORIGIN || 'http://localhost:3001',
    ];

    app.enableCors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn(`CORS blocked request from: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    // Global validation pipe (validates all DTOs automatically)
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,  // Strip unknown properties
            forbidNonWhitelisted: false,  // Allow extra properties (for MVP)
            transform: true,  // Auto-transform payloads to DTO types
        }),
    );

    // API versioning
    app.setGlobalPrefix('api/v1');

    // Swagger API Documentation
    const config = new DocumentBuilder()
        .setTitle('OTC Platform - Identity Service')
        .setDescription('Authentication and User Management API')
        .setVersion('1.0')
        .addBearerAuth()  // JWT authentication
        .addTag('auth', 'Authentication endpoints')
        .addTag('users', 'User management endpoints')
        .addTag('kyc', 'KYC verification endpoints')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0'); // Listen on all network interfaces for Railway

    logger.log(`🚀 Identity Service running on: http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`✅ Health Check: http://localhost:${port}/api/v1/health`);

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
        logger.log(`${signal} received. Starting graceful shutdown...`);

        try {
            await app.close();
            logger.log('✅ Application closed successfully');
            process.exit(0);
        } catch (error) {
            logger.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error);
        gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
}

bootstrap();
