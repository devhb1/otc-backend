import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * JwtStrategy - Passport JWT Authentication Strategy
 * 
 * This strategy is used to protect routes with authentication.
 * When a request includes a JWT token in the Authorization header,
 * this strategy validates it and attaches the user to the request object.
 * 
 * Flow:
 * 1. Extract JWT from Authorization header (Bearer token)
 * 2. Verify token signature using secret
 * 3. Extract user ID from token payload
 * 4. Load user from database
 * 5. Attach user to request (accessible via @Req() or @CurrentUser())
 * 
 * @example
 * // In controller:
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Req() req) {
 *   return req.user; // User injected by this strategy
 * }
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
    ) {
        super({
            // Extract JWT from Authorization header (Bearer token)
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

            // If true, expired tokens are rejected
            ignoreExpiration: false,

            // Secret key to verify token signature
            secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'default-secret',
        });
    }

    /**
     * Validate method is called after token is verified
     * 
     * @param payload - Decoded JWT payload { sub: userId, email, role }
     * @returns User object (attached to request)
     */
    async validate(payload: any) {
        // Load full user data from database
        const user = await this.authService.validateUser(payload.sub);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // This user object is attached to request
        return user;
    }
}
