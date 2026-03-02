import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Roles Decorator
 * 
 * Used with RolesGuard to protect routes based on user roles.
 * 
 * @example
 * // Only admins can access:
 * @Get('admin-only')
 * @Roles('ADMIN')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * adminEndpoint() {}
 * 
 * // Sellers and admins can access:
 * @Post('create-ad')
 * @Roles('SELLER', 'ADMIN')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * createAd() {}
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
