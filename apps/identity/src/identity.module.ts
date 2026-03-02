import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { EmailModule } from '@app/email';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthController } from './health/health.controller';

/**
 * Identity Service Module
 * 
 * Root module for the Identity microservice.
 * Handles all authentication and user management functionality.
 * 
 * Architecture:
 * - AuthModule: Login, register, JWT tokens
 * - UsersModule: User CRUD, profile management
 * - HealthController: Health check endpoints for Railway/monitoring
 * 
 * Shared modules:
 * - ConfigModule: Environment variables
 * - DatabaseModule: Prisma database access
 * - EmailModule: Email sending (OTP, welcome emails)
 */
@Module({
    imports: [
        // Configuration (loads .env file)
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
        }),

        // Shared database module (Prisma)
        DatabaseModule,

        // Email service (OTP verification)
        EmailModule,

        // Feature modules
        AuthModule,
        UsersModule,
    ],
    controllers: [HealthController],
})
export class IdentityModule { }
