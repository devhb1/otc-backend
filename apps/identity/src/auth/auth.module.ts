import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * AuthModule - Authentication Module
 * 
 * Provides authentication functionality:
 * - User registration
 * - User login
 * - JWT token management
 * - Password hashing/verification
 * 
 * Dependencies:
 * - PassportModule: Authentication framework
 * - JwtModule: JWT token generation/verification
 * - DatabaseModule: User data access (imported globally)
 * 
 * Exports:
 * - AuthService: Used by other modules that need auth logic
 * - JwtStrategy: Used by guards to protect routes
 */
@Module({
    imports: [
        // Passport for authentication strategies
        PassportModule.register({ defaultStrategy: 'jwt' }),

        // JWT module configuration
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_ACCESS_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_ACCESS_EXPIRY') as any || '15m',
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService, JwtStrategy],
})
export class AuthModule { }
