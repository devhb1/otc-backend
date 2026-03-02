import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser Decorator
 * 
 * Extracts the current authenticated user from the request.
 * This is cleaner than using @Req() req and accessing req.user.
 * 
 * @example
 * // In any controller:
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user) {
 *   return user; // { id, email, role, kycStatus }
 * }
 * 
 * // Get specific property:
 * @Post('create')
 * create(@CurrentUser('id') userId: string) {
 *   // Just get the user ID
 * }
 */
export const CurrentUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        // If specific property requested, return that
        return data ? user?.[data] : user;
    },
);
