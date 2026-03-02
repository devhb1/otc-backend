import { Controller, Get, Param, UseGuards, Req, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

/**
 * UsersController - User Management Endpoints
 * 
 * All endpoints require JWT authentication.
 */
@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))  // All routes require authentication
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * Get current user profile
     */
    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@Req() req) {
        return this.usersService.findById(req.user.id);
    }

    /**
     * Get user by ID (admin feature future)
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({ status: 200, description: 'User found' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getUserById(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    /**
     * Switch role between BUYER and SELLER
     */
    @Patch('switch-role')
    @ApiOperation({ summary: 'Switch user role' })
    @ApiResponse({ status: 200, description: 'Role switched successfully' })
    async switchRole(
        @Req() req,
        @Body('newRole') newRole: 'BUYER' | 'SELLER',
    ) {
        return this.usersService.switchRole(req.user.id, newRole);
    }
}
