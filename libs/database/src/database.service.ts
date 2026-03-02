import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

/**
 * DatabaseService - Prisma Client Wrapper
 * 
 * This service extends PrismaClient and implements lifecycle hooks
 * to manage database connections properly.
 * 
 * Key Features:
 * 1. Auto-connects on module initialization
 * 2. Auto-disconnects on module destruction
 * 3. Query logging in development (helps with debugging)
 * 4. Centralized error handling
 * 
 * @example
 * // Create a user
 * const user = await this.db.user.create({
 *   data: { email: 'test@test.com', passwordHash: 'hashed' }
 * });
 * 
 * // Use transactions
 * await this.db.$transaction(async (tx) => {
 *   await tx.user.create(...);
 *   await tx.wallet.create(...);
 * });
 */
@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DatabaseService.name);

    constructor(private configService: ConfigService) {
        super({
            datasources: {
                db: {
                    url: configService.get<string>('DATABASE_URL'),
                },
            },
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']
                : ['error'],
            errorFormat: 'pretty',
        });
    }

    /**
     * Called when the NestJS module is initialized
     * Establishes database connection
     */
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Database connected successfully');
        } catch (error) {
            this.logger.error('❌ Database connection failed', error);
            throw error;
        }
    }

    /**
     * Called when the NestJS module is destroyed
     * Cleanly closes database connection
     */
    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('❌ Database disconnected');
    }

    /**
     * Helper method to check database health
     * Useful for health check endpoints
     */
    async healthCheck(): Promise<boolean> {
        try {
            await this.$queryRaw`SELECT 1`;
            return true;
        } catch {
            return false;
        }
    }
}
