import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for email verification
 */
export class VerifyEmailDto {
    @ApiProperty({
        example: 'john@example.com',
        description: 'User email address',
    })
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;

    @ApiProperty({
        example: '123456',
        description: '6-digit verification code sent to email',
    })
    @IsString()
    @Length(6, 6, { message: 'Verification code must be 6 digits' })
    @Matches(/^\d{6}$/, { message: 'Verification code must be numeric' })
    otp: string;
}

/**
 * DTO for resending OTP
 */
export class ResendOtpDto {
    @ApiProperty({
        example: 'john@example.com',
        description: 'User email address',
    })
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;
}
