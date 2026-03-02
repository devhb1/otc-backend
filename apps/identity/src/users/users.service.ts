import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@app/database';

/**
 * UsersService - User Management Business Logic
 * 
 * Handles user-related operations:
 * - Get user profile
 * - Update user information
 * - Role management
 * - Account status management
 */
@Injectable()
export class UsersService {
    constructor(private readonly db: DatabaseService) { }

    /**
     * Get user by ID
     */
    async findById(id: string) {
        const user = await this.db.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                kycStatus: true,
                referralCode: true,
                referredBy: true,
                createdAt: true,
                updatedAt: true,
                // Include wallet balances
                wallets: {
                    select: {
                        currency: true,
                        balance: true,
                        lockedBalance: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    /**
     * Get user by email
     */
    async findByEmail(email: string) {
        return this.db.user.findUnique({
            where: { email },
        });
    }

    /**
     * Switch user role (BUYER <-> SELLER)
     * Users can switch between buyer and seller roles
     */
    async switchRole(userId: string, newRole: 'BUYER' | 'SELLER') {
        const user = await this.db.user.update({
            where: { id: userId },
            data: { role: newRole },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });

        return user;
    }
}
