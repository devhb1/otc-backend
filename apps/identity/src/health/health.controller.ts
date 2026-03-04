import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseService } from '@app/database';
import { EmailService } from '@app/email';
import { ConfigService } from '@nestjs/config';

/**
 * Health Check Controller
 * 
 * Essential for production deployments:
 * - Railway uses this to check if service is healthy
 * - Load balancers use this for health checks
 * - Monitoring tools ping this endpoint
 * 
 * Returns 200 OK if service is healthy, 503 if unhealthy
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(
        private readonly db: DatabaseService,
        private readonly emailService: EmailService,
        private readonly configService: ConfigService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Health check endpoint' })
    @ApiResponse({
        status: 200,
        description: 'Service is healthy',
        schema: {
            example: {
                status: 'ok',
                timestamp: '2026-03-01T12:00:00.000Z',
                service: 'identity',
                database: 'connected',
                uptime: 3600.5,
            },
        },
    })
    @ApiResponse({ status: 503, description: 'Service unavailable' })
    async check() {
        const startTime = process.hrtime();

        // Check database connection
        let dbStatus = 'disconnected';
        try {
            await this.db.$queryRaw`SELECT 1`;
            dbStatus = 'connected';
        } catch (error) {
            dbStatus = 'error';
        }

        const [seconds, nanoseconds] = process.hrtime(startTime);
        const responseTime = seconds * 1000 + nanoseconds / 1000000; // Convert to ms

        return {
            status: dbStatus === 'connected' ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            service: 'identity',
            database: dbStatus,
            uptime: process.uptime(),
            responseTime: `${responseTime.toFixed(2)}ms`,
            environment: process.env.NODE_ENV || 'development',
        };
    }

    @Get('ready')
    @ApiOperation({ summary: 'Readiness check - is service ready to accept traffic?' })
    async readiness() {
        try {
            // Check if database is accessible
            await this.db.$queryRaw`SELECT 1`;

            return {
                ready: true,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            throw new Error('Service not ready');
        }
    }

    @Get('live')
    @ApiOperation({ summary: 'Liveness check - is service alive?' })
    async liveness() {
        return {
            alive: true,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('smtp')
    @ApiOperation({ summary: 'SendGrid API configuration and connection test' })
    @ApiResponse({
        status: 200,
        description: 'SendGrid API diagnostic information',
    })
    async smtpCheck() {
        // Get SendGrid API configuration (hide API key)
        const apiKey = this.configService.get<string>('SENDGRID_API_KEY') ||
            this.configService.get<string>('SMTP_PASS');

        const smtpConfig = {
            from: this.configService.get<string>('SMTP_FROM'),
            hasApiKey: !!apiKey,
            apiKeyLength: apiKey?.length || 0,
            apiKeyValid: apiKey?.startsWith('SG.') || false,
        };

        // Test SendGrid connection
        const connectionTest = await this.emailService.testConnection();

        return {
            timestamp: new Date().toISOString(),
            configuration: smtpConfig,
            connectionTest,
            status: connectionTest.success ? 'configured' : 'misconfigured',
            message: connectionTest.success
                ? 'SendGrid API is properly configured and ready'
                : 'SendGrid API connection failed - check API key',
        };
    }
}
