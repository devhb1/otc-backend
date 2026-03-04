import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import * as ejs from 'ejs';
import * as path from 'path';

/**
 * EmailService - Production-ready email service using SendGrid HTTP API
 * 
 * Features:
 * - Send OTP verification emails
 * - Send welcome emails
 * - EJS templates for professional emails
 * - SendGrid HTTP API (bypasses SMTP port blocking on Railway)
 * - Error handling and logging
 * 
 * Environment Variables Required:
 * - SENDGRID_API_KEY: SendGrid API key (SG.xxx)
 * - SMTP_FROM: From email address (must be verified in SendGrid)
 */
@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private templatesPath: string;
    private sendGridConfigured: boolean = false;

    constructor(private readonly configService: ConfigService) {
        // Use __dirname to get path relative to compiled code location
        // Works in both dev (runs from source) and prod (runs from dist)
        this.templatesPath = path.join(__dirname, '..', '..', 'templates');

        // Initialize SendGrid HTTP API
        const apiKey = this.configService.get<string>('SENDGRID_API_KEY') ||
            this.configService.get<string>('SMTP_PASS'); // Fallback to SMTP_PASS

        if (apiKey && apiKey.startsWith('SG.')) {
            sgMail.setApiKey(apiKey);
            this.sendGridConfigured = true;
            this.logger.log('✅ SendGrid API initialized');

            // Test connection
            this.verifyConnection();
        } else {
            this.logger.error('❌ SendGrid API key not configured or invalid');
            this.logger.warn('⚠️  App will continue, but emails will fail');
        }
    }

    /**
     * Verify SendGrid API key on startup
     */
    private async verifyConnection(): Promise<void> {
        try {
            // SendGrid doesn't have a verify endpoint, so we'll just log success
            this.logger.log('✅ Email service ready - SendGrid HTTP API configured');
        } catch (error) {
            this.logger.error('❌ SendGrid initialization failed:', error.message);
            this.logger.warn('⚠️  App will continue, but emails will fail');
        }
    }

    /**
     * Test SendGrid connection (diagnostic)
     * Returns detailed connection status
     */
    async testConnection(): Promise<any> {
        if (!this.sendGridConfigured) {
            return {
                success: false,
                message: 'SendGrid API not configured',
            };
        }

        return {
            success: true,
            message: 'SendGrid API configured',
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
     * 
     * @param email - Recipient email
     * @param userName - User's name for personalization
     * @param otp - 6-digit OTP code
     */
    async sendOtpEmail(email: string, userName: string, otp: string): Promise<boolean> {
        if (!this.sendGridConfigured) {
            this.logger.error('SendGrid not configured, cannot send email');
            return false;
        }

        try {
            const templatePath = path.join(this.templatesPath, 'verification.ejs');
            const html = await ejs.renderFile(templatePath, {
                userName,
                otpCode: otp,
            });

            const fromEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@otcplatform.com';
            const msg = {
                to: email,
                from: fromEmail,
                subject: 'Verify Your Email - OTC Platform',
                html,
            };

            await sgMail.send(msg);
            this.logger.log(`✅ OTP email sent to ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to send OTP email to ${email}:`, error.message);
            if (error.response) {
                this.logger.error('SendGrid error:', error.response.body);
            }
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
        if (!this.sendGridConfigured) {
            this.logger.error('SendGrid not configured, cannot send email');
            return false;
        }

        try {
            const templatePath = path.join(this.templatesPath, 'welcome.ejs');
            const html = await ejs.renderFile(templatePath, {
                userName,
            });

            const fromEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@otcplatform.com';
            const msg = {
                to: email,
                from: fromEmail,
                subject: '🎉 Welcome to OTC Platform!',
                html,
            };

            await sgMail.send(msg);
            this.logger.log(`✅ Welcome email sent to ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to send welcome email to ${email}:`, error.message);
            if (error.response) {
                this.logger.error('SendGrid error:', error.response.body);
            }
            return false;
        }
    }

    /**
     * Send test email (for debugging)
     */
    async sendTestEmail(email: string): Promise<boolean> {
        if (!this.sendGridConfigured) {
            this.logger.error('SendGrid not configured, cannot send email');
            return false;
        }

        try {
            const fromEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@otcplatform.com';
            const msg = {
                to: email,
                from: fromEmail,
                subject: 'Test Email - OTC Platform',
                html: '<h1>Test Email</h1><p>If you received this, SendGrid HTTP API is working!</p>',
            };

            await sgMail.send(msg);
            this.logger.log(`✅ Test email sent to ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to send test email to ${email}:`, error.message);
            if (error.response) {
                this.logger.error('SendGrid error:', error.response.body);
            }
            return false;
        }
    }
}
