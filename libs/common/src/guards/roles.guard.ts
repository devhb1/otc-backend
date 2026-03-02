import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard - Role-Based Access Control
 * 
 * Checks if the current user has the required role(s) to access a route.
 * Works with @Roles() decorator.
 * 
 * Usage:
 * 1. Add @Roles() decorator to controller/method
 * 2. Add @UseGuards(JwtAuthGuard, RolesGuard)
 * 3. User must have one of the specified roles
 * 
 * @example
 * @Post('create-ad')
 * @Roles('SELLER', 'ADMIN')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * async createAd() {
 *   // Only SELLER or ADMIN can access
 * }
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Get required roles from @Roles() decorator
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        // If no roles specified, allow access
        if (!requiredRoles) {
            return true;
        }

        // Get user from request (added by JwtStrategy)
        const { user } = context.switchToHttp().getRequest();

        // Check if user has one of the required roles
        return requiredRoles.some((role) => user.role === role);
    }
}
