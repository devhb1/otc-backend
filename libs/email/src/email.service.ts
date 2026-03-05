import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import * as path from 'path';

/**
 * EmailService - Gmail SMTP email service
 * 
 * Features:
 * - Send OTP verification emails
 * - Send welcome emails
 * - EJS templates for professional emails
 * - Gmail SMTP with App Password (secure SSL on port 465)
 * - Error handling and logging
 * 
 * Environment Variables Required:
 * - SMTP_HOST: smtp.gmail.com
 * - SMTP_PORT: 465
 * - SMTP_USER: your-email@gmail.com
 * - SMTP_PASS: your-app-password
 * - SMTP_FROM: your-email@gmail.com
 */
@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private templatesPath: string;
    private transporter: nodemailer.Transporter;
    private smtpConfigured: boolean = false;

    constructor(private readonly configService: ConfigService) {
        // Use __dirname to get path relative to compiled code location
        this.templatesPath = path.join(__dirname, '..', 'templates');

        // Initialize Gmail SMTP transporter
        const smtpHost = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
        const smtpPort = this.configService.get<number>('SMTP_PORT') || 465;
        const smtpUser = this.configService.get<string>('SMTP_USER');
        const smtpPass = this.configService.get<string>('SMTP_PASS');

        if (smtpUser && smtpPass) {
            try {
                this.transporter = nodemailer.createTransport({
                    host: smtpHost,
                    port: smtpPort,
                    secure: true, // SSL on port 465
                    auth: {
                        user: smtpUser,
                        pass: smtpPass,
                    },
                });
                this.smtpConfigured = true;
                this.logger.log(`✅ Gmail SMTP initialized (${smtpHost}:${smtpPort})`);
            } catch (error) {
                this.logger.error('❌ Failed to initialize SMTP:', error.message);
            }
        } else {
            this.logger.error('❌ SMTP credentials not configured');
            this.logger.warn('⚠️  App will continue, but emails will fail');
        }
    }

    /**
     * Test SMTP connection
     */
    async testConnection(): Promise<any> {
        if (!this.smtpConfigured) {
            return {
                success: false,
                message: 'SMTP not configured',
            };
        }

        try {
            await this.transporter.verify();
            return {
                success: true,
                message: 'SMTP connection successful',
            };
        } catch (error) {
            return {
                success: false,
                message: `SMTP connection failed: ${error.message}`,
            };
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
     */
    async sendOtpEmail(email: string, userName: string, otp: string): Promise<boolean> {
        if (!this.smtpConfigured) {
            this.logger.error('SMTP not configured, cannot send email');
            return false;
        }

        try {
            const templatePath = path.join(this.templatesPath, 'verification.ejs');
            const html = await ejs.renderFile(templatePath, {
                userName,
                otpCode: otp,
            });

            const fromEmail = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');
            
            await this.transporter.sendMail({
                from: `"OTC Platform" <${fromEmail}>`,
                to: email,
                subject: 'Verify Your Email - OTC Platform',
                html,
            });

            this.logger.log(`✅ OTP email sent to ${email}`);
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
        if (!this.smtpConfigured) {
            this.logger.error('SMTP not configured, cannot send email');
            return false;
        }

        try {
            const templatePath = path.join(this.templatesPath, 'welcome.ejs');
            const html = await ejs.renderFile(templatePath, {
                userName,
            });

            const fromEmail = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');
            
            await this.transporter.sendMail({
                from: `"OTC Platform" <${fromEmail}>`,
                to: email,
                subject: '🎉 Welcome to OTC Platform!',
                html,
            });

            this.logger.log(`✅ Welcome email sent to ${email}`);
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
        if (!this.smtpConfigured) {
            this.logger.error('SMTP not configured, cannot send email');
            return false;
        }

        try {
            const fromEmail = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');
            
            await this.transporter.sendMail({
                from: `"OTC Platform" <${fromEmail}>`,
                to: email,
                subject: 'Test Email - OTC Platform',
                html: '<h1>Test Email</h1><p>If you received this, Gmail SMTP is working!</p>',
            });

            this.logger.log(`✅ Test email sent to ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to send test email to ${email}`);
            this.logger.error('Error:', error.message);
            return false;
        }
    }
}
