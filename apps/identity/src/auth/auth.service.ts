import { Injectable, UnauthorizedException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '@app/database';
import { EmailService } from '@app/email';
import { RegisterDto, LoginDto } from './dto';
import { UserRole } from '@prisma/client';

/**
 * AuthService - Authentication Business Logic
 * 
 * This service handles all authentication-related operations:
 * 1. User registration with email verification
 * 2. User login with password verification
 * 3. JWT token generation (access + refresh)
 * 4. Token validation
 * 5. Email OTP verification
 * 
 * Security Best Practices:
 * - Passwords are NEVER stored in plain text
 * - bcrypt with 12 rounds for password hashing
 * - Email verification required before login
 * - Separate access (short-lived) and refresh (long-lived) tokens
 * - Email uniqueness enforced at database level
 * 
 * @example
 * const result = await authService.register({
 *   email: 'john@example.com',
 *   password: 'SecurePass123!',
 *   role: 'BUYER'
 * });
 */
@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly db: DatabaseService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
    ) { }

    /**
     * Register a new user
     * 
     * Steps:
     * 1. Check if email already exists
     * 2. Hash password (12 rounds of bcrypt)
     * 3. Generate 6-digit OTP
     * 4. Create user in database (isVerified = false)
     * 5. Create empty wallets for common currencies
     * 6. Send OTP email
     * 7. Return message (NO TOKENS - must verify email first)
     * 
     * @throws ConflictException if email already exists
     */
    async register(registerDto: RegisterDto) {
        const { email, password, role, referralCode } = registerDto;

        // Check if user already exists
        const existingUser = await this.db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Hash password (12 rounds = more secure but slower)
        const passwordHash = await bcrypt.hash(password, 12);

        // Generate unique referral code for this user
        const userReferralCode = this.generateReferralCode();

        // Generate 6-digit OTP
        const verifyCode = this.emailService.generateOTP();
        const verifyCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user with transaction (atomic operation)
        const user = await this.db.$transaction(async (tx) => {
            // Create user (unverified)
            const newUser = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    role: role as UserRole,
                    referralCode: userReferralCode,
                    referredBy: referralCode || null,
                    isVerified: false,
                    verifyCode,
                    verifyCodeExpiry,
                },
            });

            // Create default wallets for common currencies
            await tx.wallet.createMany({
                data: [
                    { userId: newUser.id, currency: 'MAAL' },
                    { userId: newUser.id, currency: 'USDT' },
                    { userId: newUser.id, currency: 'USD' },
                ],
            });

            return newUser;
        });

        this.logger.log(`New user registered: ${email} (${role}) - Verification email sent`);

        // Send OTP email
        const emailSent = await this.emailService.sendOtpEmail(
            email,
            email.split('@')[0], // Use email prefix as name
            verifyCode
        );

        if (!emailSent) {
            this.logger.warn(`Failed to send verification email to ${email}`);
        }

        return {
            message: 'Registration successful! Please check your email for verification code.',
            email: user.email,
            emailSent,
        };
    }

    /**
     * Login existing user
     * 
     * Steps:
     * 1. Find user by email
     * 2. Check if email is verified
     * 3. Check if account is suspended
     * 4. Verify password
     * 5. Generate new JWT tokens
     * 
     * @throws UnauthorizedException if credentials invalid, email not verified, or account suspended
     */
    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Find user (including password hash for verification)
        const user = await this.db.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if email is verified
        if (!user.isVerified) {
            throw new UnauthorizedException('Please verify your email before logging in');
        }

        // Check if account is suspended
        if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
            throw new UnauthorizedException('Account is suspended or deactivated');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        this.logger.log(`User logged in: ${email}`);

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role);

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                kycStatus: user.kycStatus,
            },
            ...tokens,
        };
    }

    /**
     * Generate JWT access and refresh tokens
     * 
     * Access Token:
     * - Short-lived (15 minutes)
     * - Used for API authentication
     * - Contains user ID, email, role
     * 
     * Refresh Token:
     * - Long-lived (7 days)
     * - Used to get new access tokens
     * - Should be stored securely on client
     */
    private async generateTokens(userId: string, email: string, role: UserRole) {
        const payload = { sub: userId, email, role };

        const [accessToken, refreshToken] = await Promise.all([
            // Access token (short-lived)
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
                expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRY') || '15m') as any,
            }),
            // Refresh token (long-lived)
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d') as any,
            }),
        ]);

        return {
            accessToken,
            refreshToken,
            expiresIn: 900, // 15 minutes in seconds
        };
    }

    /**
     * Validate JWT token and return user data
     * Used by JwtStrategy for protected routes
     */
    async validateUser(userId: string) {
        const user = await this.db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                kycStatus: true,
            },
        });

        if (!user || user.status !== 'ACTIVE') {
            throw new UnauthorizedException('User not found or inactive');
        }

        return user;
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken: string) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            // Generate new tokens
            return this.generateTokens(payload.sub, payload.email, payload.role);
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    /**
     * Verify email with OTP code
     * 
     * Steps:
     * 1. Find user by email
     * 2. Check if already verified
     * 3. Validate OTP and expiry
     * 4. Mark user as verified
     * 5. Clear OTP fields
     * 6. Send welcome email
     * 
     * @throws BadRequestException if OTP invalid or expired
     */
    async verifyEmail(email: string, otp: string) {
        const user = await this.db.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.isVerified) {
            throw new BadRequestException('Email already verified');
        }

        // Check OTP
        if (user.verifyCode !== otp) {
            throw new BadRequestException('Invalid verification code');
        }

        // Check expiry
        if (user.verifyCodeExpiry && new Date() > user.verifyCodeExpiry) {
            throw new BadRequestException('Verification code has expired');
        }

        // Mark as verified and clear OTP fields
        await this.db.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verifyCode: null,
                verifyCodeExpiry: null,
            },
        });

        this.logger.log(`Email verified: ${email}`);

        // Send welcome email
        await this.emailService.sendWelcomeEmail(
            email,
            email.split('@')[0]
        );

        return {
            message: 'Email verified successfully! You can now login.',
            isVerified: true,
        };
    }

    /**
     * Resend OTP verification code
     * 
     * Steps:
     * 1. Find user by email
     * 2. Check if already verified
     * 3. Generate new OTP
     * 4. Update database
     * 5. Send new OTP email
     * 
     * @throws BadRequestException if user not found or already verified
     */
    async resendOtp(email: string) {
        const user = await this.db.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.isVerified) {
            throw new BadRequestException('Email already verified');
        }

        // Generate new OTP
        const verifyCode = this.emailService.generateOTP();
        const verifyCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user with new OTP
        await this.db.user.update({
            where: { id: user.id },
            data: {
                verifyCode,
                verifyCodeExpiry,
            },
        });

        // Send OTP email
        const emailSent = await this.emailService.sendOtpEmail(
            email,
            email.split('@')[0],
            verifyCode
        );

        this.logger.log(`OTP resent to: ${email}`);

        return {
            message: 'Verification code sent successfully!',
            emailSent,
        };
    }

    /**
     * Generate a unique referral code
     * Format: 6 uppercase alphanumeric characters (e.g., "ABC123")
     */
    private generateReferralCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Test email configuration (diagnostic)
     * 
     * Tests SMTP connection and sends a test email.
     * Useful for debugging email issues in production.
     */
    async testEmailConfig(email: string) {
        try {
            // Test SMTP connection
            const connectionTest = await this.emailService.testConnection();

            // Send test email
            const emailSent = email
                ? await this.emailService.sendTestEmail(email)
                : false;

            return {
                smtp: {
                    host: this.configService.get('SMTP_HOST'),
                    port: this.configService.get('SMTP_PORT'),
                    user: this.configService.get('SMTP_USER'),
                    from: this.configService.get('SMTP_FROM'),
                    configured: !!(
                        this.configService.get('SMTP_HOST') &&
                        this.configService.get('SMTP_USER') &&
                        this.configService.get('SMTP_PASS')
                    ),
                },
                connection: connectionTest,
                testEmailSent: emailSent,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error('Email config test failed:', error);
            return {
                error: error.message,
                stack: error.stack,
            };
        }
    }
}
