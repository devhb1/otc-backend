import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, VerifyEmailDto, ResendOtpDto } from './dto';

/**
 * AuthController - Authentication Endpoints
 * 
 * Public endpoints (no authentication required):
 * - POST /auth/register - Register new user
 * - POST /auth/login - Login existing user
 * - POST /auth/refresh - Refresh access token
 * 
 * These are the only public endpoints in the entire platform.
 * All other endpoints require JWT authentication.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * Register a new user
     * 
     * Creates a new user account with:
     * - Email (unique)
     * - Password (hashed)
     * - Role (BUYER, SELLER, ENABLER)
     * - Auto-generated referral code
     * - Empty wallets for MAAL, USDT, USD
     * 
     * Returns JWT tokens for immediate login.
     */
    @Post('register')
    @ApiOperation({ summary: 'Register new user' })
    @ApiResponse({
        status: 201,
        description: 'User successfully registered',
        schema: {
            example: {
                user: {
                    id: 'uuid',
                    email: 'john@example.com',
                    role: 'BUYER',
                    kycStatus: 'PENDING',
                    referralCode: 'ABC123',
                },
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                expiresIn: 900,
            },
        },
    })
    @ApiResponse({ status: 409, description: 'Email already registered' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    /**
     * Login existing user
     * 
     * Authenticates user with email and password.
     * Returns new JWT tokens on successful login.
     * 
     * Security:
     * - Passwords are verified using bcrypt
     * - Account must be ACTIVE (not suspended)
     * - Failed login attempts should be logged (future feature)
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)  // 200 instead of 201
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({
        status: 200,
        description: 'User successfully logged in',
        schema: {
            example: {
                user: {
                    id: 'uuid',
                    email: 'john@example.com',
                    role: 'BUYER',
                    kycStatus: 'PENDING',
                },
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                expiresIn: 900,
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Invalid credentials or account suspended' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    /**
     * Refresh access token
     * 
     * When access token expires (after 15 minutes), use refresh token
     * to get a new access token without re-entering credentials.
     * 
     * This allows users to stay logged in for 7 days.
     */
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({
        status: 200,
        description: 'Token successfully refreshed',
        schema: {
            example: {
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                expiresIn: 900,
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
    async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }

    /**
     * Verify email with OTP
     * 
     * After registration, user receives a 6-digit OTP via email.
     * This endpoint validates the OTP and activates the account.
     * 
     * Only verified users can login.
     */
    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify email with OTP code' })
    @ApiResponse({
        status: 200,
        description: 'Email successfully verified',
        schema: {
            example: {
                message: 'Email verified successfully! You can now login.',
                isVerified: true,
            },
        },
    })
    @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
    async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
        return this.authService.verifyEmail(verifyEmailDto.email, verifyEmailDto.otp);
    }

    /**
     * Resend OTP verification code
     * 
     * If user didn't receive the OTP or it expired (10 minutes),
     * they can request a new one here.
     * 
     * Rate limiting recommended (implement in production).
     */
    @Post('resend-otp')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Resend OTP verification code' })
    @ApiResponse({
        status: 200,
        description: 'OTP successfully resent',
        schema: {
            example: {
                message: 'Verification code sent successfully!',
                emailSent: true,
            },
        },
    })
    @ApiResponse({ status: 400, description: 'Email already verified or user not found' })
    async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
        return this.authService.resendOtp(resendOtpDto.email);
    }
}
