import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * LoginDto - User Login Data
 * 
 * Simpler validation than registration since we're just checking credentials.
 * 
 * @example
 * {
 *   "email": "john@example.com",
 *   "password": "SecurePass123!"
 * }
 */
export class LoginDto {
    @ApiProperty({
        example: 'john@example.com',
        description: 'User email address',
    })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({
        example: 'SecurePass123!',
        description: 'User password',
    })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    password: string;
}
