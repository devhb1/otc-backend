import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import * as path from 'path';

/**
 * EmailService - Production-ready email service
 * 
 * Features:
 * - Send OTP verification emails
 * - Send welcome emails
 * - EJS templates for professional emails
 * - SMTP configuration from environment variables
 * - Error handling and logging
 * 
 * Environment Variables Required:
 * - SMTP_HOST: SMTP server host (e.g., smtp.gmail.com)
 * - SMTP_PORT: SMTP server port (e.g., 587)
 * - SMTP_USER: SMTP username/email
 * - SMTP_PASS: SMTP password/app password
 * - SMTP_FROM: From email address
 */
@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;
    private templatesPath: string;

    constructor(private readonly configService: ConfigService) {
        this.templatesPath = path.join(process.cwd(), 'libs', 'email', 'templates');

        // Initialize nodemailer transporter
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT') || 587,
            secure: this.configService.get<number>('SMTP_PORT') === 465,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });

        // Verify connection on startup
        this.verifyConnection();
    }

    /**
     * Verify SMTP connection on startup
     */
    private async verifyConnection(): Promise<void> {
        try {
            await this.transporter.verify();
            this.logger.log('✅ Email service ready - SMTP connection verified');
        } catch (error) {
            this.logger.error('❌ SMTP connection failed:', error.message);
            this.logger.warn('⚠️  App will continue, but emails will fail');
        }
    }

    /**
     * Generate a 6-digit OTP
     */
    generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Send OTP verification email
     * 
     * @param email - Recipient email
     * @param userName - User's name for personalization
     * @param otp - 6-digit OTP code
     */
    async sendOtpEmail(email: string, userName: string, otp: string): Promise<boolean> {
        try {
            const templatePath = path.join(this.templatesPath, 'verification.ejs');

            const html = await ejs.renderFile(templatePath, {
                userName,
                otpCode: otp,
            });

            await this.transporter.sendMail({
                from: this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER'),
                to: email,
                subject: 'Verify Your Email - OTC Platform',
                html,
            });

            this.logger.log(`✅ OTP email sent to ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to send OTP email to ${email}:`, error.message);
            return false;
        }
    }

    /**
     * Send welcome email after successful verification
     * 
     * @param email - Recipient email
     * @param userName - User's name
     */
    async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
        try {
            const templatePath = path.join(this.templatesPath, 'welcome.ejs');

            const html = await ejs.renderFile(templatePath, {
                userName,
            });

            await this.transporter.sendMail({
                from: this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER'),
                to: email,
                subject: '🎉 Welcome to OTC Platform!',
                html,
            });

            this.logger.log(`✅ Welcome email sent to ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to send welcome email to ${email}:`, error.message);
            return false;
        }
    }

    /**
     * Send test email (for debugging)
     */
    async sendTestEmail(email: string): Promise<boolean> {
        try {
            await this.transporter.sendMail({
                from: this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER'),
                to: email,
                subject: 'Test Email - OTC Platform',
                html: '<h1>Test Email</h1><p>If you received this, email service is working!</p>',
            });

            this.logger.log(`✅ Test email sent to ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to send test email to ${email}:`, error.message);
            return false;
        }
    }
}
