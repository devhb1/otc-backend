import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';

/**
 * DatabaseModule - Shared database access module
 * 
 * This module is marked as @Global() which means it's available
 * to all other modules without needing to import it explicitly.
 * 
 * Benefits:
 * 1. Single database connection (efficient)
 * 2. Centralized Prisma client management
 * 3. All services use the same database instance
 * 4. Easy to mock in tests
 * 
 * @example
 * // In any service, just inject DatabaseService
 * constructor(private readonly db: DatabaseService) {}
 */
@Global()
@Module({
    imports: [ConfigModule],
    providers: [DatabaseService],
    exports: [DatabaseService],
})
export class DatabaseModule { }
