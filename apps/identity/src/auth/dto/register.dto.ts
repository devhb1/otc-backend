import { IsEmail, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * RegisterDto - User Registration Data
 * 
 * This DTO defines what data is required for user registration
 * and includes validation rules to ensure data quality.
 * 
 * Security considerations:
 * - Email must be valid format
 * - Password must be strong (8+ chars, uppercase, lowercase, number, special char)
 * - All fields are required (no null/undefined)
 * 
 * @example
 * {
 *   "email": "john@example.com",
 *   "password": "SecurePass123!",
 *   "role": "BUYER"
 * }
 */
export class RegisterDto {
    @ApiProperty({
        example: 'john@example.com',
        description: 'User email address (must be unique)',
    })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({
        example: 'SecurePass123!',
        description: 'Password (min 8 chars, must include uppercase, lowercase, number, special char)',
        minLength: 8,
    })
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(50, { message: 'Password must not exceed 50 characters' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        { message: 'Password must contain uppercase, lowercase, number and special character' },
    )
    password: string;

    @ApiProperty({
        example: 'BUYER',
        description: 'User role',
        enum: ['BUYER', 'SELLER', 'ENABLER'],
    })
    @IsNotEmpty({ message: 'Role is required' })
    role: 'BUYER' | 'SELLER' | 'ENABLER';

    @ApiProperty({
        example: 'REF123',
        description: 'Referral code (optional)',
        required: false,
    })
    referralCode?: string;
}
