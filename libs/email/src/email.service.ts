import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import * as ejs from 'ejs';
import * as path from 'path';

/**
 * EmailService - Production-ready email service using MailerSend API
 * 
 * Features:
 * - Send OTP verification emails
 * - Send welcome emails
 * - EJS templates for professional emails
 * - MailerSend HTTP API (bypasses SMTP port blocking on Railway)
 * - 12,000 emails/month free tier (vs SendGrid's 3,000)
 * - Error handling and logging
 * 
 * Environment Variables Required:
 * - MAILERSEND_API_KEY: MailerSend API key (mlsn.xxx)
 * - SMTP_FROM: From email address (e.g., noreply@test-xxx.mlsender.net)
 */
@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private templatesPath: string;
    private mailerSend: MailerSend;
    private mailerSendConfigured: boolean = false;
    private fromEmail: string;

    constructor(private readonly configService: ConfigService) {
        // Use __dirname to get path relative to compiled code location
        // In production: dist/libs/email/src -> go up to email, then into templates
        this.templatesPath = path.join(__dirname, '..', 'templates');

        // Initialize MailerSend API
        const apiKey = this.configService.get<string>('MAILERSEND_API_KEY');
        this.fromEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@test-r83qI3pvjoxqzw1j.mlsender.net';

        if (apiKey && apiKey.startsWith('mlsn.')) {
            this.mailerSend = new MailerSend({ apiKey });
            this.mailerSendConfigured = true;
            this.logger.log('✅ MailerSend API initialized');
            this.logger.log(`📧 Using from email: ${this.fromEmail}`);
        } else {
            this.logger.error('❌ MailerSend API key not configured or invalid');
            this.logger.warn('⚠️  App will continue, but emails will fail');
        }
    }

    /**
     * Test MailerSend connection (diagnostic)
     * Returns detailed connection status
     */
    async testConnection(): Promise<any> {
        if (!this.mailerSendConfigured) {
            return {
                success: false,
                message: 'MailerSend API not configured',
            };
        }

        return {
            success: true,
            message: 'MailerSend API configured',
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
        if (!this.mailerSendConfigured) {
            this.logger.error('MailerSend not configured, cannot send email');
            return false;
        }

        try {
            const templatePath = path.join(this.templatesPath, 'verification.ejs');
            const html = await ejs.renderFile(templatePath, {
                userName,
                otpCode: otp,
            });

            const sentFrom = new Sender(this.fromEmail, 'OTC Platform');
            const recipients = [new Recipient(email, userName)];

            const emailParams = new EmailParams()
                .setFrom(sentFrom)
                .setTo(recipients)
                .setSubject('Verify Your Email - OTC Platform')
                .setHtml(html);

            await this.mailerSend.email.send(emailParams);
            this.logger.log(`✅ OTP email sent to ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to send OTP email to ${email}`);
            this.logger.error('Error message:', error.message || 'No message');
            this.logger.error('Error name:', error.name || 'No name');
            this.logger.error('Full error:', JSON.stringify(error, null, 2));
            if (error.response) {
                this.logger.error('Response status:', error.response.status);
                this.logger.error('Response data:', JSON.stringify(error.response.body || error.response.data, null, 2));
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
        if (!this.mailerSendConfigured) {
            this.logger.error('MailerSend not configured, cannot send email');
            return false;
        }

        try {
            const templatePath = path.join(this.templatesPath, 'welcome.ejs');
            const html = await ejs.renderFile(templatePath, {
                userName,
            });

            const sentFrom = new Sender(this.fromEmail, 'OTC Platform');
            const recipients = [new Recipient(email, userName)];

            const emailParams = new EmailParams()
                .setFrom(sentFrom)
                .setTo(recipients)
                .setSubject('🎉 Welcome to OTC Platform!')
                .setHtml(html);

            await this.mailerSend.email.send(emailParams);
            this.logger.log(`✅ Welcome email sent to ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to send welcome email to ${email}`);
            this.logger.error('Full error:', JSON.stringify(error, null, 2));
            return false;
        }
    }

    /**
     * Send test email (for debugging)
     */
    async sendTestEmail(email: string): Promise<boolean> {
        if (!this.mailerSendConfigured) {
            this.logger.error('MailerSend not configured, cannot send email');
            return false;
        }

        try {
            const sentFrom = new Sender(this.fromEmail, 'OTC Platform');
            const recipients = [new Recipient(email, 'Test User')];

            const emailParams = new EmailParams()
                .setFrom(sentFrom)
                .setTo(recipients)
                .setSubject('Test Email - OTC Platform')
                .setHtml('<h1>Test Email</h1><p>If you received this, MailerSend API is working!</p>');

            await this.mailerSend.email.send(emailParams);
            this.logger.log(`✅ Test email sent to ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to send test email to ${email}`);
            this.logger.error('Full error:', JSON.stringify(error, null, 2));
            return false;
        }
    }
}
