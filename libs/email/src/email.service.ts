import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as ejs from 'ejs';
import * as path from 'path';

/**
 * EmailService - Resend API email service
 * 
 * Features:
 * - Send OTP verification emails
 * - Send welcome emails
 * - EJS templates for professional emails
 * - Resend HTTP API (works on Railway - no SMTP port blocking)
 * - Free tier: 100 emails/day, 3,000/month
 * - Error handling and logging
 * 
 * Environment Variables Required:
 * - RESEND_API_KEY: Resend API key (re_xxx)
 * - SMTP_FROM: From email address (e.g., onboarding@resend.dev or your verified domain)
 */
@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private templatesPath: string;
    private resend: Resend;
    private resendConfigured: boolean = false;
    private fromEmail: string;

    constructor(private readonly configService: ConfigService) {
        // Use __dirname to get path relative to compiled code location
        this.templatesPath = path.join(__dirname, '..', 'templates');

        // Initialize Resend API
        const apiKey = this.configService.get<string>('RESEND_API_KEY');
        this.fromEmail = this.configService.get<string>('SMTP_FROM') || 'onboarding@resend.dev';

        if (apiKey && apiKey.startsWith('re_')) {
            this.resend = new Resend(apiKey);
            this.resendConfigured = true;
            this.logger.log('✅ Resend API initialized');
            this.logger.log(`📧 Using from email: ${this.fromEmail}`);
        } else {
            this.logger.error('❌ Resend API key not configured or invalid');
            this.logger.warn('⚠️  App will continue, but emails will fail');
        }
    }

    /**
     * Test Resend connection
     */
    async testConnection(): Promise<any> {
        if (!this.resendConfigured) {
            return {
                success: false,
                message: 'Resend API not configured',
            };
        }

        return {
            success: true,
            message: 'Resend API configured',
        };
    }

    /**
     * Generate a 6-digit OTP
     */
    generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Send OTP verification email
     */
    async sendOtpEmail(email: string, userName: string, otp: string): Promise<boolean> {
        if (!this.resendConfigured) {
            this.logger.error('Resend not configured, cannot send email');
            return false;
        }

        try {
            const templatePath = path.join(this.templatesPath, 'verification.ejs');
            const html = await ejs.renderFile(templatePath, {
                userName,
                otpCode: otp,
            });

            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: [email],
                subject: 'Verify Your Email - OTC Platform',
                html,
            });

            if (error) {
                this.logger.error(`❌ Failed to send OTP email to ${email}:`, error.message);
                return false;
            }

            this.logger.log(`✅ OTP email sent to ${email} (ID: ${data?.id})`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to send OTP email to ${email}`);
            this.logger.error('Error:', error.message);
            return false;
        }
    }

    /**
     * Send welcome email after successful verification
     */
    async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
        if (!this.resendConfigured) {
            this.logger.error('Resend not configured, cannot send email');
            return false;
        }

        try {
            const templatePath = path.join(this.templatesPath, 'welcome.ejs');
            const html = await ejs.renderFile(templatePath, {
                userName,
            });

            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: [email],
                subject: '🎉 Welcome to OTC Platform!',
                html,
            });

            if (error) {
                this.logger.error(`❌ Failed to send welcome email to ${email}:`, error.message);
                return false;
            }

            this.logger.log(`✅ Welcome email sent to ${email} (ID: ${data?.id})`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to send welcome email to ${email}`);
            this.logger.error('Error:', error.message);
            return false;
        }
    }

    /**
     * Send test email (for debugging)
     */
    async sendTestEmail(email: string): Promise<boolean> {
        if (!this.resendConfigured) {
            this.logger.error('Resend not configured, cannot send email');
            return false;
        }

        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: [email],
                subject: 'Test Email - OTC Platform',
                html: '<h1>Test Email</h1><p>If you received this, Resend API is working!</p>',
            });

            if (error) {
                this.logger.error(`❌ Failed to send test email to ${email}:`, error.message);
                return false;
            }

            this.logger.log(`✅ Test email sent to ${email} (ID: ${data?.id})`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to send test email to ${email}`);
            this.logger.error('Error:', error.message);
            return false;
        }
    }
}
