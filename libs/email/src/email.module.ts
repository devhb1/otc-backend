import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';

/**
 * EmailModule - Global module for email sending
 * 
 * This module is marked as @Global(), meaning you can inject
 * EmailService anywhere without importing this module repeatedly.
 * 
 * Just import it once in AppModule.
 */
@Global()
@Module({
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule { }
